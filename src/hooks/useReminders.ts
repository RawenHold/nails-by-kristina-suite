import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { format, parseISO } from "date-fns";

export type Reminder = Tables<"reminders"> & {
  clients?: { full_name: string; phone: string | null } | null;
  computed_status?: "overdue" | "today" | "upcoming" | "sent";
};

export function computeReminderStatus(reminderDate: string, status: string): "overdue" | "today" | "upcoming" | "sent" {
  if (status === "sent") return "sent";
  const today = format(new Date(), "yyyy-MM-dd");
  if (reminderDate < today) return "overdue";
  if (reminderDate === today) return "today";
  return "upcoming";
}

export function useReminders(opts?: { clientId?: string; includeSent?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reminders", user?.id, opts],
    queryFn: async () => {
      let q = supabase.from("reminders").select("*, clients(full_name, phone)").order("reminder_date");
      if (opts?.clientId) q = q.eq("client_id", opts.clientId);
      if (!opts?.includeSent) q = q.neq("status", "sent");
      const { data, error } = await q;
      if (error) throw error;
      const enriched = (data as Reminder[]).map(r => ({
        ...r,
        computed_status: computeReminderStatus(r.reminder_date, r.status),
      }));
      // Sort: overdue → today → upcoming
      const order = { overdue: 0, today: 1, upcoming: 2, sent: 3 };
      enriched.sort((a, b) => order[a.computed_status!] - order[b.computed_status!]);
      return enriched;
    },
    enabled: !!user,
    refetchInterval: 60_000, // refresh statuses every minute
  });
}

export function useCreateReminder() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"reminders">, "owner_id">) => {
      const { data, error } = await supabase.from("reminders").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Напоминание создано");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateReminderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reminders").update({ status: status as Tables<"reminders">["status"] }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Напоминание удалено");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
