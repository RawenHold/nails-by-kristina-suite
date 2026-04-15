import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { Image, Heart, X, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GalleryPhoto {
  id: string;
  url: string;
  client: string;
  date: string;
  tags: string[];
  isFavorite: boolean;
}

const mockPhotos: GalleryPhoto[] = [
  { id: "1", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop", client: "Anna K.", date: "Apr 12", tags: ["gel", "french", "nude"], isFavorite: true },
  { id: "2", url: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=400&fit=crop", client: "Maria S.", date: "Apr 10", tags: ["art", "flowers", "spring"], isFavorite: false },
  { id: "3", url: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400&h=400&fit=crop", client: "Elena V.", date: "Apr 8", tags: ["classic", "red", "elegant"], isFavorite: true },
  { id: "4", url: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=400&fit=crop", client: "Olga P.", date: "Apr 5", tags: ["minimalist", "beige"], isFavorite: false },
  { id: "5", url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop&q=80", client: "Natasha R.", date: "Apr 3", tags: ["neon", "bright", "summer"], isFavorite: true },
  { id: "6", url: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400&h=400&fit=crop&q=80", client: "Anna K.", date: "Mar 28", tags: ["gel", "ombre"], isFavorite: false },
];

const filters = ["All", "✨ Best Works", "Recent"];

export default function GalleryPage() {
  const [filter, setFilter] = useState("All");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const filtered = mockPhotos.filter((p) => {
    if (filter === "✨ Best Works") return p.isFavorite;
    return true;
  });

  const selectedPhoto = selectedIndex !== null ? filtered[selectedIndex] : null;

  const goNext = () => {
    if (selectedIndex !== null && selectedIndex < filtered.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };
  const goPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Gallery" subtitle={`${mockPhotos.length} designs`} />

      <div className="px-4 space-y-3 pb-4">
        <ChipGroup options={filters} selected={filter} onChange={setFilter} />

        {/* Best Works Banner */}
        {filter === "✨ Best Works" && filtered.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard elevated className="text-center py-4">
              <Star className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-sm font-semibold text-foreground">Your Best Works</p>
              <p className="text-[11px] text-muted-foreground">{filtered.length} favorite designs</p>
            </GlassCard>
          </motion.div>
        )}

        {filtered.length === 0 ? (
          <EmptyState icon={Image} title="No photos yet" description="Upload your first nail design photo after a visit" />
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedIndex(i)}
                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
              >
                <img src={photo.url} alt={`Design for ${photo.client}`} className="w-full h-full object-cover" loading="lazy" />
                {photo.isFavorite && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center">
                    <Heart className="w-3 h-3 text-primary fill-primary" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-2 pt-6">
                  <p className="text-[10px] text-white font-medium">{photo.client}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 safe-top pb-2">
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedPhoto.client}</p>
                <p className="text-[11px] text-muted-foreground">{selectedPhoto.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toast.info("Toggled favorite")}
                  className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <Heart className={cn("w-4 h-4", selectedPhoto.isFavorite ? "text-primary fill-primary" : "text-muted-foreground")} />
                </button>
                <button
                  onClick={() => setSelectedIndex(null)}
                  className="w-9 h-9 rounded-xl bg-secondary/70 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center px-2 relative">
              {selectedIndex !== null && selectedIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 z-10 w-10 h-10 rounded-full bg-secondary/60 backdrop-blur flex items-center justify-center active:scale-90"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
              )}
              <motion.img
                key={selectedPhoto.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={selectedPhoto.url}
                alt="Nail design"
                className="max-w-full max-h-full rounded-3xl object-contain"
              />
              {selectedIndex !== null && selectedIndex < filtered.length - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-2 z-10 w-10 h-10 rounded-full bg-secondary/60 backdrop-blur flex items-center justify-center active:scale-90"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              )}
            </div>

            {/* Tags + Counter */}
            <div className="px-4 pb-2 safe-bottom space-y-2">
              <div className="flex justify-center">
                <span className="text-[11px] text-muted-foreground">
                  {selectedIndex !== null ? selectedIndex + 1 : 0} / {filtered.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {selectedPhoto.tags.map((tag) => (
                  <span key={tag} className="text-[11px] bg-secondary/80 text-secondary-foreground px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingActionButton onClick={() => toast.info("Upload photos coming soon")} />
    </div>
  );
}
