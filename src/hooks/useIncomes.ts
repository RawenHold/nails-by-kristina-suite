import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

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
      const { data, error } = await supabase.from("incomes").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incomes"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Доход записан"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("incomes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["incomes"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Доход удалён"); },
    onError: (e: any) => toast.error(e.message),
  });
}
