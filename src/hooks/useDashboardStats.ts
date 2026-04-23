import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, format } from "date-fns";
import { computeReminderStatus } from "./useReminders";

export function useDashboardStats(period: string) {
  const { user } = useAuth();
  const now = new Date();

  let start: Date, end: Date;
  if (period === "today") { start = startOfDay(now); end = endOfDay(now); }
  else if (period === "week") { start = startOfWeek(now, { weekStartsOn: 1 }); end = endOfWeek(now, { weekStartsOn: 1 }); }
  else { start = startOfMonth(now); end = endOfMonth(now); }

  return useQuery({
    queryKey: ["dashboard", user?.id, period],
    queryFn: async () => {
      const s = start.toISOString();
      const e = end.toISOString();
      const todayStr = format(now, "yyyy-MM-dd");

      const upcomingEnd = endOfDay(addDays(now, 30)).toISOString();

      const [incomesRes, expensesRes, appointmentsRes, clientsRes, remindersRes, completedRes] = await Promise.all([
        supabase.from("incomes").select("amount").gte("received_at", s).lte("received_at", e),
        supabase.from("expenses").select("amount").gte("spent_at", s).lte("spent_at", e),
        // Upcoming appointments: from start of today up to 30 days ahead, exclude canceled/no_show
        supabase
          .from("appointments")
          .select("id, start_time, end_time, expected_price, status, client_id, clients(full_name, loyalty_level)")
          .gte("start_time", startOfDay(now).toISOString())
          .lte("start_time", upcomingEnd)
          .not("status", "in", "(canceled,no_show)")
          .order("start_time"),
        supabase.from("clients").select("id, full_name, total_spent, total_visits, lifecycle_status, loyalty_level, last_visit_date, days_since_last_visit").eq("is_archived", false).order("total_spent", { ascending: false }).limit(50),
        // Pull all non-sent reminders so we can recompute statuses client-side
        supabase.from("reminders").select("*, clients(id, full_name, phone)").neq("status", "sent").order("reminder_date"),
        supabase.from("appointments").select("final_price, expected_price").eq("status", "completed").gte("start_time", s).lte("start_time", e),
      ]);

      const totalIncome = (incomesRes.data || []).reduce((acc, i) => acc + i.amount, 0);
      const totalExpenses = (expensesRes.data || []).reduce((acc, e) => acc + e.amount, 0);
      const appointments = appointmentsRes.data || [];
      const allClients = clientsRes.data || [];
      const topClients = [...allClients].sort((a, b) => b.total_spent - a.total_spent).slice(0, 5);
      const reminders = (remindersRes.data || []).map(r => ({
        ...r,
        computed_status: computeReminderStatus(r.reminder_date, r.status),
      }));
      const order = { overdue: 0, today: 1, upcoming: 2, sent: 3 } as const;
      reminders.sort((a, b) => order[a.computed_status] - order[b.computed_status]);

      const activeClients = allClients.filter(c => c.lifecycle_status === "active" || c.lifecycle_status === "vip").length;
      const completedCount = (completedRes.data || []).length;
      const completedSum = (completedRes.data || []).reduce((acc, a) => acc + (a.final_price ?? a.expected_price), 0);
      const avgCheck = completedCount > 0 ? Math.round(completedSum / completedCount) : 0;

      return {
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        // Kept for backward compat — same as upcomingAppointments now.
        appointmentsToday: appointments,
        upcomingAppointments: appointments,
        topClients,
        totalClients: allClients.length,
        reminders,
        activeClients,
        avgCheck,
        todayStr,
      };
    },
    enabled: !!user,
    refetchInterval: 60_000,
  });
}
