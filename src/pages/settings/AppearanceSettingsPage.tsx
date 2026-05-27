import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import PaletteSlider from "@/components/settings/PaletteSlider";
import CinematicThemeSwitch from "@/components/ui/CinematicThemeSwitch";
import { useTheme } from "@/hooks/useTheme";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div>
      <PageHeader title="Внешний вид" showBack hideSettings />
      <div className="px-4 space-y-4 pb-nav">
        <GlassCard>
          <p className="text-xs font-semibold text-foreground mb-3">Тема оформления</p>
          <div className="flex flex-col items-center gap-3">
            <CinematicThemeSwitch
              isDark={isDark}
              onToggle={() => setTheme(isDark ? "light" : "dark")}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setTheme("system")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors",
                theme === "system"
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <Monitor className="w-3 h-3" /> Как в системе
            </motion.button>
          </div>
        </GlassCard>

        <PaletteSlider />
      </div>
    </div>
  );
}
