import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { enqueueMutation } from "@/lib/offline/queue";

const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

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
      if (isOffline()) {
        const now = new Date().toISOString();
        const row: any = {
          id: crypto.randomUUID(),
          full_name: input.full_name,
          phone: input.phone ?? null,
          telegram_link: (input as any).telegram_link ?? null,
          telegram_username: (input as any).telegram_username ?? null,
          notes: input.notes ?? null,
          allergies: input.allergies ?? null,
          avatar_url: input.avatar_url ?? null,
          favorite_colors: (input as any).favorite_colors ?? null,
          favorite_designs: (input as any).favorite_designs ?? null,
          favorite_length: (input as any).favorite_length ?? null,
          favorite_shape: (input as any).favorite_shape ?? null,
          manual_reminder_date: (input as any).manual_reminder_date ?? null,
          recommended_next_visit: (input as any).recommended_next_visit ?? null,
          owner_id: user!.id,
          loyalty_level: "bronze",
          lifecycle_status: "new",
          total_spent: 0,
          total_visits: 0,
          average_check: 0,
          is_archived: false,
          created_at: now,
          updated_at: now,
          last_visit_date: null,
          days_since_last_visit: null,
        };
        await enqueueMutation({ table: "clients", op: "insert", payload: row });
        return row;
      }
      const { data, error } = await supabase.from("clients").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(isOffline() ? "Клиентка сохранена офлайн" : "Клиентка добавлена");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка создания"),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ClientUpdate & { id: string }) => {
      if (isOffline()) {
        await enqueueMutation({ table: "clients", op: "update", payload: updates, match: { id } });
        return { id, ...updates } as any;
      }
      const { data, error } = await supabase.from("clients").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client", data.id] });
      toast.success(isOffline() ? "Изменения сохранены офлайн" : "Данные обновлены");
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
