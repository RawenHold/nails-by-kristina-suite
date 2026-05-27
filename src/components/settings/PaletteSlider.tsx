import { motion } from "framer-motion";
import { usePalette, PALETTES, type PaletteId } from "@/hooks/usePalette";
import GlassCard from "@/components/ui/GlassCard";
import { Palette, Check } from "lucide-react";

/**
 * Palette picker — vibrant colored swatches. Each swatch shows its true
 * brand color with a glossy highlight and a primary-tinted glow when active.
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
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center gap-1.5 outline-none"
              aria-label={p.label}
              aria-pressed={isActive}
            >
              <span
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                style={{
                  background: p.swatch,
                  boxShadow: isActive
                    ? `0 0 0 2px hsl(var(--background)), 0 0 0 3.5px ${p.swatch}`
                    : "0 1px 2px rgba(0,0,0,0.15)",
                }}
              >
                {isActive && (
                  <Check className="w-4 h-4 text-white" strokeWidth={3} />
                )}
              </span>
              <span
                className="text-[10px] font-medium leading-none"
                style={{ color: isActive ? p.swatch : "hsl(var(--muted-foreground))" }}
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
