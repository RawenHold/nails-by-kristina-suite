import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import PaletteSlider from "@/components/settings/PaletteSlider";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassSurface } from "@/components/ui/LiquidGlass";
import { motion } from "framer-motion";

const themes = [
  { value: "light" as const, icon: Sun, label: "Светлая" },
  { value: "dark" as const, icon: Moon, label: "Тёмная" },
  { value: "system" as const, icon: Monitor, label: "Системная" },
];

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <PageHeader title="Внешний вид" showBack hideSettings />
      <div className="px-4 space-y-4 pb-nav">
        <GlassCard>
          <p className="text-xs font-semibold text-foreground mb-3">Тема оформления</p>
          <div className="flex gap-2">
            {themes.map((t) => {
              const active = theme === t.value;
              return (
                <motion.button
                  key={t.value}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTheme(t.value)}
                  className="flex-1"
                >
                  <GlassSurface
                    className={cn(
                      "rounded-2xl py-3 flex flex-col items-center gap-1.5",
                      active ? "ring-2 ring-primary/40" : ""
                    )}
                    style={{
                      boxShadow: active
                        ? "0 6px 18px hsl(var(--primary) / 0.25)"
                        : "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  >
                    <t.icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}>
                      {t.label}
                    </span>
                  </GlassSurface>
                </motion.button>
              );
            })}
          </div>
        </GlassCard>

        <PaletteSlider />
      </div>
    </div>
  );
}
