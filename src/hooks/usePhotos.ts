import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
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

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (filters?.clientId) {
        filtered = filtered.filter((p: any) => p.visits?.client_id === filters.clientId);
      }

      // Generate signed URLs
      const photos = await Promise.all(filtered.map(async (p) => {
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
      // Compress to FullHD (max 1920px) before uploading
      let toUpload: File = file;
      try {
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1920,
          maxSizeMB: 2,
          useWebWorker: true,
          fileType: "image/jpeg",
          initialQuality: 0.85,
        });
        toUpload = new File([compressed], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
      } catch (e) {
        // fallback to original
        toUpload = file;
      }

      const path = `${user!.id}/${visitId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from("visit-photos").upload(path, toUpload, {
        contentType: "image/jpeg",
      });
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["photos"] }); },
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

export function useBulkDeletePhotos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; storagePath: string }[]) => {
      if (!items.length) return;
      const paths = items.map(i => i.storagePath);
      const ids = items.map(i => i.id);
      await supabase.storage.from("visit-photos").remove(paths);
      const { error } = await supabase.from("visit_photos").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["photos"] });
      toast.success(`Удалено фото: ${vars.length}`);
    },
    onError: (e: any) => toast.error(e.message || "Ошибка удаления"),
  });
}
