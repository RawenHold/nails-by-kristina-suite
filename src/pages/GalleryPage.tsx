import { useState, useRef, useMemo, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import EmptyState from "@/components/ui/EmptyState";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import BottomSheet from "@/components/ui/BottomSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Image as ImageIcon, Heart, X, Star, Trash2, Download, Upload, Users, Check, CheckSquare, Square, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePhotos, useToggleFavorite, useDeletePhoto, useUploadPhoto, useBulkDeletePhotos, type VisitPhoto } from "@/hooks/usePhotos";
import { useVisits } from "@/hooks/useVisits";
import { useClients } from "@/hooks/useClients";

type FilterMode = "all" | "favorites";

function formatDateRu(d: string | Date) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
}
function formatGroupKey(d: string | Date) {
  const date = new Date(d);
  return date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
}

export default function GalleryPage() {
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedClientId, setSelectedClientId] = useState<string | "all">("all");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; storagePath: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [uploadVisitId, setUploadVisitId] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: photos, isLoading } = usePhotos({
    favoritesOnly: filterMode === "favorites",
    clientId: selectedClientId === "all" ? undefined : selectedClientId,
  });
  const { data: visits } = useVisits();
  const { data: clients } = useClients();
  const toggleFav = useToggleFavorite();
  const deletePhoto = useDeletePhoto();
  const bulkDelete = useBulkDeletePhotos();
  const uploadPhoto = useUploadPhoto();

  const filtered: VisitPhoto[] = photos || [];
  const selectedPhoto = selectedIndex !== null ? filtered[selectedIndex] : null;

  // Group by month for gallery view
  const grouped = useMemo(() => {
    const groups: Record<string, { key: string; items: { photo: VisitPhoto; index: number }[] }> = {};
    filtered.forEach((photo, index) => {
      const dateRef = photo.visits?.visit_date || photo.created_at;
      const key = formatGroupKey(dateRef);
      if (!groups[key]) groups[key] = { key, items: [] };
      groups[key].items.push({ photo, index });
    });
    return Object.values(groups);
  }, [filtered]);

  const selectedClientName = selectedClientId === "all"
    ? "Все клиенты"
    : clients?.find(c => c.id === selectedClientId)?.full_name || "Клиент";

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [filterMode, selectedClientId]);

  const togglePhotoSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handlePhotoClick = (photo: VisitPhoto, index: number) => {
    if (selectionMode) {
      togglePhotoSelection(photo.id);
    } else {
      setSelectedIndex(index);
    }
  };

  const handlePhotoLongPress = (photo: VisitPhoto) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedIds(new Set([photo.id]));
    }
  };

  const handleBulkDelete = async () => {
    const items = filtered
      .filter(p => selectedIds.has(p.id))
      .map(p => ({ id: p.id, storagePath: p.storage_path }));
    await bulkDelete.mutateAsync(items);
    exitSelection();
    setConfirmBulk(false);
  };

  // Swipe navigation
  const goNext = () => { if (selectedIndex !== null && selectedIndex < filtered.length - 1) setSelectedIndex(selectedIndex + 1); };
  const goPrev = () => { if (selectedIndex !== null && selectedIndex > 0) setSelectedIndex(selectedIndex - 1); };

  const handleDownload = async () => {
    if (!selectedPhoto?.url) return;
    try {
      const filename = `knails-photo-${selectedPhoto.id}.jpg`;
      const target = await savePhotoToDevice(selectedPhoto.url, filename);
      toast.success(target === "native" ? "Сохранено в Файлы" : "Фото скачано");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !uploadVisitId) return;
    const arr = Array.from(files);
    setUploadProgress({ current: 0, total: arr.length });
    let ok = 0;
    for (let i = 0; i < arr.length; i++) {
      try {
        await uploadPhoto.mutateAsync({ file: arr[i], visitId: uploadVisitId });
        ok++;
      } catch {}
      setUploadProgress({ current: i + 1, total: arr.length });
    }
    setUploadProgress(null);
    setShowUpload(false);
    setUploadVisitId("");
    if (ok > 0) toast.success(`Загружено фото: ${ok}`);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="min-h-screen pb-32">
      {selectionMode ? (
        <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-xl border-b border-border/40 safe-top">
          <div className="px-4 py-3 flex items-center justify-between">
            <button onClick={exitSelection} className="text-sm font-medium text-primary">Отмена</button>
            <div className="text-sm font-semibold text-foreground">
              {selectedIds.size > 0 ? `Выбрано: ${selectedIds.size}` : "Выберите фото"}
            </div>
            <button onClick={selectAll} className="text-sm font-medium text-primary">
              {selectedIds.size === filtered.length && filtered.length > 0 ? "Снять" : "Все"}
            </button>
          </div>
        </div>
      ) : (
        <PageHeader title="Галерея" subtitle={`${filtered.length} фото`} />
      )}

      <div className="px-4 space-y-3">
        {/* Filter row */}
        {!selectionMode && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterMode("all")}
                className={cn(
                  "flex-1 h-10 rounded-2xl text-sm font-medium transition-all",
                  filterMode === "all" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/70 text-foreground"
                )}
              >
                Все фото
              </button>
              <button
                onClick={() => setFilterMode("favorites")}
                className={cn(
                  "flex-1 h-10 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                  filterMode === "favorites" ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/70 text-foreground"
                )}
              >
                <Star className="w-3.5 h-3.5" /> Избранные
              </button>
              <button
                onClick={() => setSelectionMode(true)}
                disabled={!filtered.length}
                className="h-10 px-3 rounded-2xl bg-secondary/70 text-foreground text-sm font-medium flex items-center gap-1.5 disabled:opacity-40"
              >
                <CheckSquare className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setShowClientPicker(true)}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/60 text-foreground text-sm flex items-center justify-between active:scale-[0.99] transition-transform"
            >
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{selectedClientName}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-3 gap-1.5 mt-3">{[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square rounded-2xl shimmer" />)}</div>
        ) : !filtered.length ? (
          <EmptyState icon={ImageIcon} title="Нет фото" description="Загрузите первое фото после визита" />
        ) : (
          <div className="space-y-5 pt-1">
            {grouped.map((group) => (
              <div key={group.key}>
                <h3 className="text-[13px] font-semibold text-foreground mb-2 capitalize px-1">
                  {group.key}
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {group.items.map(({ photo, index }) => {
                    const isSel = selectedIds.has(photo.id);
                    const dateRef = photo.visits?.visit_date || photo.created_at;
                    return (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        onClick={() => handlePhotoClick(photo, index)}
                        onContextMenu={(e) => { e.preventDefault(); handlePhotoLongPress(photo); }}
                        className={cn(
                          "relative aspect-square rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform",
                          isSel && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                      >
                        <img src={photo.url} alt="" className="w-full h-full object-cover" loading="lazy" />

                        {/* Favorite badge */}
                        {photo.is_favorite && !selectionMode && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center">
                            <Heart className="w-2.5 h-2.5 text-primary fill-primary" />
                          </div>
                        )}

                        {/* Selection circle */}
                        {selectionMode && (
                          <div className={cn(
                            "absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                            isSel
                              ? "bg-primary border-primary"
                              : "bg-black/30 border-white/80 backdrop-blur-sm"
                          )}>
                            {isSel && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                          </div>
                        )}

                        {/* Date overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent p-1.5 pt-5">
                          <p className="text-[9px] text-white/95 font-medium leading-tight">
                            {new Date(dateRef).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection action bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
            className="fixed inset-x-0 z-40 mx-3 mb-2 rounded-3xl bg-background/85 backdrop-blur-xl border border-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
          >
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">{selectedIds.size} выбрано</span>
              <button
                onClick={() => setConfirmBulk(true)}
                className="h-11 px-5 rounded-2xl bg-destructive text-destructive-foreground text-sm font-semibold flex items-center gap-2 active:scale-95 transition-transform"
              >
                <Trash2 className="w-4 h-4" /> Удалить
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Viewer with swipe */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col">
            <div className="flex items-center justify-between px-4 safe-top pb-2 pt-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{selectedPhoto.visits?.clients?.full_name || "Без клиента"}</p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateRu(selectedPhoto.visits?.visit_date || selectedPhoto.created_at)}
                  {selectedPhoto.caption && ` · ${selectedPhoto.caption}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
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

            {/* Swipeable photo area — touch-action:none stops the page (and
                browser back-swipe / bottom-nav swipe) from intercepting the
                horizontal drag used to flip between photos. */}
            <div className="flex-1 overflow-hidden relative" style={{ touchAction: "none", overscrollBehavior: "contain" }}>
              <motion.div
                key={selectedPhoto.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -80 || info.velocity.x < -500) goNext();
                  else if (info.offset.x > 80 || info.velocity.x > 500) goPrev();
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ touchAction: "none" }}
                className="w-full h-full flex items-center justify-center px-2"
              >
                <img src={selectedPhoto.url} alt="" className="max-w-full max-h-full rounded-3xl object-contain select-none pointer-events-none" draggable={false} />
              </motion.div>
            </div>

            <div className="px-4 pb-3 safe-bottom pt-2">
              <div className="flex justify-center">
                <span className="text-[11px] text-muted-foreground">{selectedIndex !== null ? selectedIndex + 1 : 0} / {filtered.length}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client picker sheet */}
      <BottomSheet open={showClientPicker} onClose={() => setShowClientPicker(false)} title="Выбрать клиента">
        <div className="space-y-1 max-h-[60vh] overflow-y-auto pb-2">
          <button
            onClick={() => { setSelectedClientId("all"); setShowClientPicker(false); }}
            className={cn(
              "w-full h-12 px-4 rounded-2xl flex items-center justify-between text-sm font-medium transition-colors",
              selectedClientId === "all" ? "bg-primary/10 text-primary" : "bg-secondary/40 text-foreground"
            )}
          >
            <span>Все клиенты</span>
            {selectedClientId === "all" && <Check className="w-4 h-4 text-primary" />}
          </button>
          {clients?.map(c => (
            <button
              key={c.id}
              onClick={() => { setSelectedClientId(c.id); setShowClientPicker(false); }}
              className={cn(
                "w-full h-12 px-4 rounded-2xl flex items-center justify-between text-sm font-medium transition-colors",
                selectedClientId === c.id ? "bg-primary/10 text-primary" : "bg-secondary/40 text-foreground"
              )}
            >
              <span className="truncate">{c.full_name}</span>
              {selectedClientId === c.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Upload sheet */}
      <BottomSheet
        open={showUpload}
        onClose={() => !uploadProgress && setShowUpload(false)}
        title="Загрузить фото"
        footer={
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (!uploadVisitId) { toast.error("Выберите визит"); return; } fileRef.current?.click(); }}
            disabled={!!uploadProgress}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            {uploadProgress ? `Загрузка ${uploadProgress.current}/${uploadProgress.total}...` : "Выбрать фото"}
          </motion.button>
        }
      >
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Визит</label>
            <select value={uploadVisitId} onChange={(e) => setUploadVisitId(e.target.value)}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">Выберите визит</option>
              {visits?.map(v => <option key={v.id} value={v.id}>{v.clients?.full_name} — {new Date(v.visit_date).toLocaleDateString("ru-RU")}</option>)}
            </select>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <p className="text-[11px] text-muted-foreground">Фото будут сжаты до Full HD (1920px) для экономии места.</p>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={() => { if (deleteTarget) { deletePhoto.mutate(deleteTarget); setSelectedIndex(null); } setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
        title="Удалить фото?"
        description="Фото будет удалено безвозвратно."
      />

      <ConfirmDialog
        open={confirmBulk}
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulk(false)}
        title={`Удалить ${selectedIds.size} фото?`}
        description="Выбранные фото будут удалены безвозвратно."
      />

      {!selectionMode && !selectedPhoto && <FloatingActionButton onClick={() => setShowUpload(true)} />}
    </div>
  );
}
