import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Client = Tables<"clients">;
export type ClientInsert = TablesInsert<"clients">;
export type ClientUpdate = TablesUpdate<"clients">;

export function useClients(filters?: {
  search?: string;
  lifecycle?: string;
  loyalty?: string;
}) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients", user?.id, filters],
    queryFn: async () => {
      let query = supabase.from("clients").select("*").eq("is_archived", false).order("updated_at", { ascending: false });

      if (filters?.search) {
        const s = `%${filters.search}%`;
        query = query.or(`full_name.ilike.${s},phone.ilike.${s},telegram_username.ilike.${s}`);
      }
      if (filters?.lifecycle && filters.lifecycle !== "all") {
        query = query.eq("lifecycle_status", filters.lifecycle as any);
      }
      if (filters?.loyalty && filters.loyalty !== "all") {
        query = query.eq("loyalty_level", filters.loyalty as any);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

export function useClient(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Client;
    },
    enabled: !!user && !!id,
  });
}

export function useCreateClient() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<ClientInsert, "owner_id">) => {
      const { data, error } = await supabase.from("clients").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиентка добавлена");
    },
    onError: (e: any) => toast.error(e.message || "Ошибка создания"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClientUpdate & { id: string }) => {
      const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", data.id] });
      toast.success("Данные обновлены");
    },
    onError: (e: any) => toast.error(e.message || "Ошибка обновления"),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").update({ is_archived: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Клиентка в архиве");
    },
    onError: (e: any) => toast.error(e.message || "Ошибка"),
  });
}
