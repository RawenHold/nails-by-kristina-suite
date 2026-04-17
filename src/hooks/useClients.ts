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
        query = query.eq("lifecycle_status", filters.lifecycle as Client["lifecycle_status"]);
      }
      if (filters?.loyalty && filters.loyalty !== "all") {
        query = query.eq("loyalty_level", filters.loyalty as Client["loyalty_level"]);
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
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Клиентка добавлена");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка создания"),
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
    onError: (e: Error) => toast.error(e.message || "Ошибка обновления"),
  });
}

/**
 * Hard-delete a client and ALL associated data.
 * Use with strong confirmation only.
 */
export function useDeleteClient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Cascade clean
      const { data: visits } = await supabase.from("visits").select("id").eq("client_id", id);
      if (visits?.length) {
        const visitIds = visits.map(v => v.id);
        await supabase.from("visit_photos").delete().in("visit_id", visitIds);
        await supabase.from("visit_tags").delete().in("visit_id", visitIds);
      }
      await supabase.from("visits").delete().eq("client_id", id);
      await supabase.from("incomes").delete().eq("client_id", id);

      const { data: appts } = await supabase.from("appointments").select("id").eq("client_id", id);
      if (appts?.length) {
        const aIds = appts.map(a => a.id);
        await supabase.from("appointment_services").delete().in("appointment_id", aIds);
      }
      await supabase.from("appointments").delete().eq("client_id", id);
      await supabase.from("reminders").delete().eq("client_id", id);
      await supabase.from("timer_sessions").update({ client_id: null }).eq("client_id", id);
      await supabase.from("client_tags").delete().eq("client_id", id);

      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["reminders"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Клиентка удалена");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });
}

export function useArchiveClient() {
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
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });
}
