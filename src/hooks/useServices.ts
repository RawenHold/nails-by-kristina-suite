import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Service = Tables<"services">;

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
      const { data, error } = await supabase.from("services").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Услуга добавлена"); },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Service>) => {
      const { error } = await supabase.from("services").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Услуга обновлена"); },
    onError: (e: any) => toast.error(e.message),
  });
}
