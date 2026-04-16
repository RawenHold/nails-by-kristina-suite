import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Reminder = Tables<"reminders"> & { clients?: { full_name: string; phone: string | null } | null };

export function useReminders(statusFilter?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reminders", user?.id, statusFilter],
    queryFn: async () => {
      let query = supabase.from("reminders").select("*, clients(full_name, phone)").order("reminder_date");
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Reminder[];
    },
    enabled: !!user,
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Напоминание создано"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateReminderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("reminders").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Статус обновлён"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["reminders"] }); toast.success("Напоминание удалено"); },
    onError: (e: any) => toast.error(e.message),
  });
}
