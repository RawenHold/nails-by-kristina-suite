import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MasterProfile {
  id: string;
  owner_id: string;
  display_name: string | null;
  phone: string | null;
  instagram: string | null;
  telegram: string | null;
  avatar_url: string | null;
}

export function useMasterProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["master_profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MasterProfile | null> => {
      const { data, error } = await supabase
        .from("master_profile")
        .select("*")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as MasterProfile | null;
    },
  });
}

export function useUpsertMasterProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Omit<MasterProfile, "id" | "owner_id">>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("master_profile")
        .upsert({ owner_id: user.id, ...input }, { onConflict: "owner_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master_profile"] });
      toast.success("Профиль сохранён");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUploadMasterAvatar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("master-avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("master-avatars").getPublicUrl(path);
      const avatar_url = pub.publicUrl;
      const { error } = await supabase
        .from("master_profile")
        .upsert({ owner_id: user.id, avatar_url }, { onConflict: "owner_id" });
      if (error) throw error;
      return avatar_url;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master_profile"] });
      toast.success("Аватар обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteMasterAvatar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      // Best-effort cleanup of stored files for this user
      const { data: list } = await supabase.storage.from("master-avatars").list(user.id);
      if (list && list.length > 0) {
        await supabase.storage
          .from("master-avatars")
          .remove(list.map((f) => `${user.id}/${f.name}`));
      }
      const { error } = await supabase
        .from("master_profile")
        .upsert({ owner_id: user.id, avatar_url: null }, { onConflict: "owner_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["master_profile"] });
      toast.success("Аватар удалён");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
