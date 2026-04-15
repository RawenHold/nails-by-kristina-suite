import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { Image, Heart, Star, X } from "lucide-react";
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

const filters = ["All", "Favorites", "Recent"];

export default function GalleryPage() {
  const [filter, setFilter] = useState("All");
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);

  const filtered = mockPhotos.filter((p) => {
    if (filter === "Favorites") return p.isFavorite;
    return true;
  });

  return (
    <div className="min-h-screen">
      <PageHeader title="Gallery" subtitle={`${mockPhotos.length} photos`} />

      <div className="px-4 space-y-3 pb-4">
        <ChipGroup options={filters} selected={filter} onChange={setFilter} />

        {filtered.length === 0 ? (
          <EmptyState
            icon={Image}
            title="No photos yet"
            description="Upload your first nail design photo"
          />
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {filtered.map((photo, i) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedPhoto(photo)}
                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform"
              >
                <img
                  src={photo.url}
                  alt={`Design for ${photo.client}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {photo.isFavorite && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-background/70 backdrop-blur flex items-center justify-center">
                    <Heart className="w-2.5 h-2.5 text-primary fill-primary" />
                  </div>
                )}
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
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg flex flex-col"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="flex items-center justify-between p-4 pt-[max(env(safe-area-inset-top),1rem)]">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedPhoto.client}</p>
                <p className="text-xs text-muted-foreground">{selectedPhoto.date}</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={selectedPhoto.url}
                alt="Nail design"
                className="max-w-full max-h-full rounded-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="p-4 safe-bottom">
              <div className="flex flex-wrap gap-1.5 justify-center">
                {selectedPhoto.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
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
