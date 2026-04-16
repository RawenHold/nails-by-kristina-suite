import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

export type VisitPhoto = Tables<"visit_photos"> & {
  visits?: { client_id: string; visit_date: string; clients?: { full_name: string } | null } | null;
  url?: string;
};

export function usePhotos(filters?: { clientId?: string; favoritesOnly?: boolean }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["photos", user?.id, filters],
    queryFn: async () => {
      let query = supabase.from("visit_photos").select("*, visits(client_id, visit_date, clients(full_name))").order("created_at", { ascending: false });
      if (filters?.favoritesOnly) query = query.eq("is_favorite", true);
      if (filters?.clientId) query = query.eq("visits.client_id", filters.clientId);

      const { data, error } = await query;
      if (error) throw error;

      // Generate signed URLs
      const photos = await Promise.all((data || []).map(async (p) => {
        const { data: urlData } = await supabase.storage.from("visit-photos").createSignedUrl(p.storage_path, 3600);
        return { ...p, url: urlData?.signedUrl || "" } as VisitPhoto;
      }));
      return photos;
    },
    enabled: !!user,
  });
}

export function useUploadPhoto() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, visitId, caption }: { file: File; visitId: string; caption?: string }) => {
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${visitId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("visit-photos").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { data, error } = await supabase.from("visit_photos").insert({
        owner_id: user!.id,
        visit_id: visitId,
        storage_path: path,
        caption,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); toast.success("Фото загружено"); },
    onError: (e: any) => toast.error(e.message || "Ошибка загрузки"),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      const { error } = await supabase.from("visit_photos").update({ is_favorite: !isFavorite }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); },
  });
}

export function useDeletePhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, storagePath }: { id: string; storagePath: string }) => {
      await supabase.storage.from("visit-photos").remove([storagePath]);
      const { error } = await supabase.from("visit_photos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); toast.success("Фото удалено"); },
    onError: (e: any) => toast.error(e.message),
  });
}
