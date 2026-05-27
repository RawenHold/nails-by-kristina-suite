import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePalette, PALETTES, type PaletteId } from "@/hooks/usePalette";
import GlassCard from "@/components/ui/GlassCard";
import { Palette } from "lucide-react";

/**
 * Horizontal palette picker. All palette swatches are stitched into one
 * continuous gradient bar; a draggable thumb snaps to the nearest swatch
 * and applies the palette. Works for both mouse and touch.
 */
export default function PaletteSlider() {
  const { palette, setPalette } = usePalette();
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState<number | null>(null);

  const count = PALETTES.length;
  const activeIndex = Math.max(0, PALETTES.findIndex((p) => p.id === palette));

  // Build a left-to-right gradient that blends every palette swatch.
  const gradient = `linear-gradient(90deg, ${PALETTES.map((p, i) => {
    const stop = (i / (count - 1)) * 100;
    return `${p.swatch} ${stop}%`;
  }).join(", ")})`;

  const pickFromX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const rel = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const ratio = rect.width === 0 ? 0 : rel / rect.width;
      const idx = Math.round(ratio * (count - 1));
      const id = PALETTES[idx].id as PaletteId;
      if (id !== palette) setPalette(id);
      setDragX(rel);
    },
    [count, palette, setPalette]
  );

  // Reset live drag position whenever palette changes externally
  useEffect(() => { setDragX(null); }, [palette]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pickFromX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (e.buttons === 0) return;
    pickFromX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    setDragX(null);
  };

  // Thumb position — either live drag, or snapped to the active swatch.
  const trackWidth = trackRef.current?.getBoundingClientRect().width ?? 0;
  const snappedX = trackWidth > 0 ? (activeIndex / (count - 1)) * trackWidth : 0;
  const thumbX = dragX ?? snappedX;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-primary" /> Цветовая палитра
        </p>
        <span className="text-[11px] text-muted-foreground">
          {PALETTES[activeIndex].label}
        </span>
      </div>

      <div
        className="relative h-12 select-none touch-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Color bar */}
        <div
          ref={trackRef}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full shadow-inner ring-1 ring-black/5 dark:ring-white/10"
          style={{ background: gradient }}
        />

        {/* Tick marks for each palette */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 flex justify-between px-[2px] pointer-events-none">
          {PALETTES.map((p, i) => (
            <div
              key={p.id}
              className="w-0.5 h-3 bg-white/40 dark:bg-black/30"
              style={{ opacity: i === 0 || i === count - 1 ? 0 : 0.5 }}
            />
          ))}
        </div>

        {/* Draggable thumb */}
        <motion.div
          className="absolute top-1/2 w-7 h-7 rounded-full bg-background border-2 border-foreground/15 shadow-lg pointer-events-none"
          style={{
            left: thumbX,
            translateX: "-50%",
            translateY: "-50%",
            boxShadow: `0 4px 14px ${PALETTES[activeIndex].swatch}66`,
          }}
          animate={{ scale: dragX != null ? 1.15 : 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
        >
          <div
            className="absolute inset-1 rounded-full"
            style={{ background: PALETTES[activeIndex].swatch }}
          />
        </motion.div>
      </div>

      <div className="mt-3 flex justify-between px-1">
        {PALETTES.map((p) => (
          <button
            key={p.id}
            onClick={() => setPalette(p.id as PaletteId)}
            className="text-[10px] font-medium text-muted-foreground active:scale-95 transition"
            style={{ color: p.id === palette ? p.swatch : undefined }}
          >
            {p.label}
          </button>
        ))}
      </div>
    </GlassCard>
  );
}
