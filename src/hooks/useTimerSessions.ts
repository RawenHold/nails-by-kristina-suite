import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useTimerSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["timer_sessions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timer_sessions")
        .select("*, clients(full_name)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useSaveTimerSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      client_id?: string | null;
      appointment_id?: string | null;
      started_at: string;
      ended_at: string;
      duration_seconds: number;
      note?: string;
    }) => {
      const { data, error } = await supabase.from("timer_sessions").insert({
        ...input,
        owner_id: user!.id,
        status: "completed" as const,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["timer_sessions"] }); toast.success("Сессия сохранена"); },
    onError: (e: any) => toast.error(e.message),
  });
}
