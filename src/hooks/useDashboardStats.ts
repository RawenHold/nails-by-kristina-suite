import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

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

      const [incomesRes, expensesRes, appointmentsRes, clientsRes, remindersRes] = await Promise.all([
        supabase.from("incomes").select("amount").gte("received_at", s).lte("received_at", e),
        supabase.from("expenses").select("amount").gte("spent_at", s).lte("spent_at", e),
        supabase.from("appointments").select("id, start_time, end_time, expected_price, status, client_id, clients(full_name)").gte("start_time", startOfDay(now).toISOString()).lte("start_time", endOfDay(now).toISOString()).order("start_time"),
        supabase.from("clients").select("id, full_name, total_spent, total_visits, lifecycle_status, loyalty_level, last_visit_date, days_since_last_visit").eq("is_archived", false).order("total_spent", { ascending: false }).limit(5),
        supabase.from("reminders").select("*, clients(full_name, phone)").in("status", ["overdue", "today", "upcoming"]).order("reminder_date"),
      ]);

      const totalIncome = (incomesRes.data || []).reduce((s, i) => s + i.amount, 0);
      const totalExpenses = (expensesRes.data || []).reduce((s, e) => s + e.amount, 0);
      const appointments = appointmentsRes.data || [];
      const topClients = clientsRes.data || [];
      const reminders = remindersRes.data || [];
      const activeClients = topClients.filter(c => c.lifecycle_status === "active" || c.lifecycle_status === "vip").length;

      return {
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
        appointmentsToday: appointments,
        topClients,
        reminders,
        activeClients,
        avgCheck: appointments.length > 0 ? Math.round(totalIncome / Math.max(appointments.filter(a => a.status === "completed").length, 1)) : 0,
      };
    },
    enabled: !!user,
  });
}
