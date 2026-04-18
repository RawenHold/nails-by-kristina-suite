import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Expense = Tables<"expenses"> & { expense_categories?: { name: string } | null };

export function useExpenses(month?: Date) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expenses", user?.id, month?.toISOString()],
    queryFn: async () => {
      let query = supabase.from("expenses").select("*, expense_categories(name)").order("spent_at", { ascending: false });
      if (month) {
        query = query.gte("spent_at", startOfMonth(month).toISOString()).lte("spent_at", endOfMonth(month).toISOString());
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Expense[];
    },
    enabled: !!user,
  });
}

export function useExpenseCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expense_categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("expense_categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateExpense() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"expenses">, "owner_id">) => {
      const { data, error } = await supabase.from("expenses").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Расход записан"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"expenses">) => {
      const { data, error } = await supabase.from("expenses").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Расход обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateExpenseCategory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from("expense_categories").insert({ name, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expense_categories"] }); toast.success("Категория добавлена"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["expenses"] }); qc.invalidateQueries({ queryKey: ["dashboard"] }); toast.success("Расход удалён"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
