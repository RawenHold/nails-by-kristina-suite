import { motion } from "framer-motion";
import { usePalette, PALETTES, type PaletteId } from "@/hooks/usePalette";
import GlassCard from "@/components/ui/GlassCard";
import { GlassSurface } from "@/components/ui/LiquidGlass";
import { Palette, Check } from "lucide-react";

/**
 * Palette picker — each option is a Liquid Glass swatch button. Selecting one
 * applies the palette globally. Adapts to light and dark themes.
 */
export default function PaletteSlider() {
  const { palette, setPalette } = usePalette();
  const active = PALETTES.find((p) => p.id === palette) ?? PALETTES[0];

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-primary" /> Цветовая палитра
        </p>
        <span className="text-[11px] text-muted-foreground">{active.label}</span>
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {PALETTES.map((p) => {
          const isActive = p.id === palette;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setPalette(p.id as PaletteId)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              className="group flex flex-col items-center gap-1.5"
              aria-label={p.label}
              aria-pressed={isActive}
            >
              <GlassSurface
                className={`relative w-14 h-14 rounded-2xl flex items-center justify-center ${
                  isActive ? "ring-2 ring-foreground/40" : ""
                }`}
                style={{
                  boxShadow: isActive
                    ? `0 8px 22px ${p.swatch}66, 0 0 0 1px hsl(0 0% 100% / 0.35) inset`
                    : `0 4px 14px ${p.swatch}33`,
                }}
              >
                <div
                  className="absolute inset-1.5 rounded-xl"
                  style={{ background: p.swatch }}
                />
                {isActive && (
                  <motion.div
                    layoutId="palette-check"
                    className="relative z-10 w-6 h-6 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow"
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: p.swatch }} />
                  </motion.div>
                )}
              </GlassSurface>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: isActive ? p.swatch : undefined }}
              >
                {p.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
}
