import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type Visit = Tables<"visits"> & {
  clients?: { full_name: string } | null;
};

export function useVisits(clientId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["visits", user?.id, clientId],
    queryFn: async () => {
      let query = supabase.from("visits").select("*, clients(full_name)").order("visit_date", { ascending: false });
      if (clientId) query = query.eq("client_id", clientId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Visit[];
    },
    enabled: !!user,
  });
}
