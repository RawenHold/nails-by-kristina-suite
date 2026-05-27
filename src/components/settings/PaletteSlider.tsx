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

      <div className="grid grid-cols-4 gap-3">
        {PALETTES.map((p) => {
          const isActive = p.id === palette;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setPalette(p.id as PaletteId)}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05 }}
              className="group flex flex-col items-center gap-1.5 outline-none"
              aria-label={p.label}
              aria-pressed={isActive}
            >
              <span
                className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: `radial-gradient(circle at 30% 28%, color-mix(in srgb, ${p.swatch} 60%, white) 0%, ${p.swatch} 55%, color-mix(in srgb, ${p.swatch} 75%, black) 100%)`,
                  boxShadow: isActive
                    ? `0 0 0 3px hsl(var(--background)), 0 0 0 5px ${p.swatch}, 0 10px 28px ${p.swatch}80`
                    : `inset 0 1px 2px rgba(255,255,255,0.55), 0 6px 16px ${p.swatch}55, 0 2px 4px rgba(0,0,0,0.12)`,
                }}
              >
                {/* glossy highlight */}
                <span
                  aria-hidden
                  className="absolute top-1.5 left-2 w-5 h-3 rounded-full bg-white/55 blur-[2px] rotate-[-18deg] pointer-events-none"
                />
                {isActive && (
                  <motion.span
                    layoutId="palette-check"
                    className="relative z-10 w-7 h-7 rounded-full bg-white/95 flex items-center justify-center shadow-md"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} style={{ color: p.swatch }} />
                  </motion.span>
                )}
              </span>
              <span
                className="text-[10px] font-semibold leading-none"
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
