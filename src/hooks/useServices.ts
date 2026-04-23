import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { enqueueMutation } from "@/lib/offline/queue";

export type Service = Tables<"services">;
const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

export function useServices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["services", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data as Service[];
    },
    enabled: !!user,
  });
}

export function useCreateService() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<TablesInsert<"services">, "owner_id">) => {
      if (isOffline()) {
        const row: any = { id: crypto.randomUUID(), owner_id: user!.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), is_active: true, display_order: 0, duration_minutes: 60, default_price: 0, ...input };
        await enqueueMutation({ table: "services", op: "insert", payload: row });
        return row;
      }
      const { data, error } = await supabase.from("services").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success(isOffline() ? "Услуга сохранена офлайн" : "Услуга добавлена"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Service>) => {
      if (isOffline()) {
        await enqueueMutation({ table: "services", op: "update", payload: updates, match: { id } });
        return;
      }
      const { error } = await supabase.from("services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success(isOffline() ? "Изменения услуги сохранены офлайн" : "Услуга обновлена"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isOffline()) {
        await enqueueMutation({ table: "services", op: "update", payload: { is_active: false }, match: { id } });
        return;
      }
      const { error } = await supabase.from("services").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success(isOffline() ? "Удаление услуги сохранено офлайн" : "Услуга удалена"); },
    onError: (e: any) => toast.error(e.message),
  });
}
