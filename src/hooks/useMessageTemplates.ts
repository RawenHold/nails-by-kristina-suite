import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type MessageTemplate = Tables<"message_templates">;

export function useMessageTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["message_templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("message_templates").select("*").eq("is_active", true).order("created_at");
      if (error) throw error;
      return data as MessageTemplate[];
    },
    enabled: !!user,
  });
}

export function useCreateMessageTemplate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; body: string }) => {
      const { data, error } = await supabase.from("message_templates").insert({ ...input, owner_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["message_templates"] }); toast.success("Шаблон создан"); },
    onError: (e: any) => toast.error(e.message),
  });
}
