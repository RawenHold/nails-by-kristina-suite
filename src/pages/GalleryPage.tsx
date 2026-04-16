import { useState, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Image, Heart, X, ChevronLeft, ChevronRight, Star, Trash2, Download, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePhotos, useToggleFavorite, useDeletePhoto, useUploadPhoto } from "@/hooks/usePhotos";
import { useVisits } from "@/hooks/useVisits";
import { useClients } from "@/hooks/useClients";

const filters = ["Все", "✨ Лучшие", "Недавние"];

export default function GalleryPage() {
  const [filter, setFilter] = useState("Все");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; storagePath: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadVisitId, setUploadVisitId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: photos, isLoading } = usePhotos({ favoritesOnly: filter === "✨ Лучшие" });
  const { data: visits } = useVisits();
  const toggleFav = useToggleFavorite();
  const deletePhoto = useDeletePhoto();
  const uploadPhoto = useUploadPhoto();

  const filtered = photos || [];
  const selectedPhoto = selectedIndex !== null ? filtered[selectedIndex] : null;

  const goNext = () => { if (selectedIndex !== null && selectedIndex < filtered.length - 1) setSelectedIndex(selectedIndex + 1); };
  const goPrev = () => { if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1); };

  const handleDownload = async () => {
    if (!selectedPhoto?.url) return;
    try {
      const res = await fetch(selectedPhoto.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `photo-${selectedPhoto.id}.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Фото сохранено");
    } catch { toast.error("Ошибка скачивания"); }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !uploadVisitId) return;
    for (const file of Array.from(files)) {
      await uploadPhoto.mutateAsync({ file, visitId: uploadVisitId });
    }
    setShowUpload(false);
    setUploadVisitId("");
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Галерея" subtitle={`${filtered.length} фото`} />
      <div className="px-4 space-y-3 pb-4">
        <ChipGroup options={filters} selected={filter} onChange={setFilter} />

        {filter === "✨ Лучшие" && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard elevated className="text-center py-4">
              <Star className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-foreground">Лучшие работы</p>
              <p className="text-[11px] text-muted-foreground">{filtered.length} избранных дизайнов</p>
            </GlassCard>
          </motion.div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-3 gap-1.5">{[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square rounded-2xl shimmer" />)}</div>
        ) : !filtered.length ? (
          <EmptyState icon={Image} title="Нет фото" description="Загрузите первое фото после визита" />
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {filtered.map((photo, i) => (
              <motion.div key={photo.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedIndex(i)} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform">
                <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {photo.is_favorite && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center">
                    <Heart className="w-3 h-3 text-primary fill-primary" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6">
                  <p className="text-[10px] text-white font-medium">{photo.visits?.clients?.full_name || ""}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 safe-top pb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedPhoto.visits?.clients?.full_name || ""}</p>
                <p className="text-[11px] text-muted-foreground">{selectedPhoto.caption || ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleFav.mutate({ id: selectedPhoto.id, isFavorite: selectedPhoto.is_favorite })}
                  className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center active:scale-90 transition-transform">
                  <Heart className={cn("w-4 h-4", selectedPhoto.is_favorite ? "text-primary fill-primary" : "text-muted-foreground")} />
                </button>
                <button onClick={handleDownload} className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center active:scale-90 transition-transform">
                  <Download className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => setDeleteTarget({ id: selectedPhoto.id, storagePath: selectedPhoto.storage_path })}
                  className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center active:scale-90 transition-transform">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
                <button onClick={() => setSelectedIndex(null)} className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center active:scale-90 transition-transform">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-2 relative">
              {selectedIndex !== null && selectedIndex > 0 && (
                <button onClick={goPrev} className="absolute left-2 z-10 w-10 h-10 rounded-full bg-secondary/60 backdrop-blur flex items-center justify-center active:scale-90">
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              )}
              <motion.img key={selectedPhoto.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                src={selectedPhoto.url} alt="" className="max-w-full max-h-full rounded-3xl object-contain" />
              {selectedIndex !== null && selectedIndex < filtered.length - 1 && (
                <button onClick={goNext} className="absolute right-2 z-10 w-10 h-10 rounded-full bg-secondary/60 backdrop-blur flex items-center justify-center active:scale-90">
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              )}
            </div>
            <div className="px-4 pb-2 safe-bottom">
              <div className="flex justify-center">
                <span className="text-[11px] text-muted-foreground">{selectedIndex !== null ? selectedIndex + 1 : 0} / {filtered.length}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload sheet */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowUpload(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">Загрузить фото</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Визит</label>
                  <select value={uploadVisitId} onChange={(e) => setUploadVisitId(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Выберите визит</option>
                    {visits?.map(v => <option key={v.id} value={v.id}>{v.clients?.full_name} — {new Date(v.visit_date).toLocaleDateString("ru-RU")}</option>)}
                  </select>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (!uploadVisitId) { toast.error("Выберите визит"); return; } fileRef.current?.click(); }}
                  disabled={uploadPhoto.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> {uploadPhoto.isPending ? "Загрузка..." : "Выбрать фото"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!deleteTarget} onConfirm={() => { if (deleteTarget) { deletePhoto.mutate(deleteTarget); setSelectedIndex(null); } setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)} title="Удалить фото?" description="Фото будет удалено безвозвратно." />

      <FloatingActionButton onClick={() => setShowUpload(true)} />
    </div>
  );
}
