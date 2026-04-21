import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { enqueueMutation } from "@/lib/offline/queue";

const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

export type Income = Tables<"incomes"> & { clients?: { full_name: string } | null };

export function useIncomes(month?: Date) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["incomes", user?.id, month?.toISOString()],
    queryFn: async () => {
      let query = supabase.from("incomes").select("*, clients(full_name)").order("received_at", { ascending: false });
      if (month) {
        query = query.gte("received_at", startOfMonth(month).toISOString()).lte("received_at", endOfMonth(month).toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Income[];
    },
    enabled: !!user,
  });
}

export function useCreateIncome() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"incomes">, "owner_id">) => {
      if (isOffline()) {
        const row: any = {
          id: crypto.randomUUID(),
          ...input,
          owner_id: user!.id,
          received_at: input.received_at ?? new Date().toISOString(),
          created_at: new Date().toISOString(),
        };
        await enqueueMutation({ table: "incomes", op: "insert", payload: row });
        return row;
      }
      const { data, error } = await supabase.from("incomes").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incomes"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success(isOffline() ? "Доход сохранён офлайн" : "Доход записан"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"incomes">) => {
      if (isOffline()) {
        await enqueueMutation({ table: "incomes", op: "update", payload: updates, match: { id } });
        return { id, ...updates } as any;
      }
      const { data, error } = await supabase.from("incomes").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(isOffline() ? "Сохранено офлайн" : "Доход обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOffline()) {
        await enqueueMutation({ table: "incomes", op: "delete", match: { id } });
        return;
      }
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incomes"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success(isOffline() ? "Удалено офлайн" : "Доход удалён"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
