"use client";

import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";

interface CinematicThemeSwitchProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

/**
 * Cinematic theme toggle — glossy thumb that slides between OFF/ON with
 * primary-glow shadow when on. Uses theme tokens so it adapts to palette.
 */
export default function CinematicThemeSwitch({ isDark, onToggle, className = "" }: CinematicThemeSwitchProps) {
  return (
    <div
      role="switch"
      aria-checked={isDark}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onToggle())}
      className={`flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm shadow-inner cursor-pointer select-none ${className}`}
    >
      <span
        className={`flex items-center gap-1 text-[11px] font-bold tracking-wider transition-colors duration-300 ${
          !isDark ? "text-foreground" : "text-muted-foreground/40"
        }`}
      >
        <Sun className="w-3.5 h-3.5" /> LIGHT
      </span>

      <motion.div
        className="relative w-16 h-8 rounded-full shadow-inner border border-border/50"
        initial={false}
        animate={{
          backgroundColor: isDark ? "hsl(var(--primary) / 0.25)" : "hsl(var(--muted))",
        }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="absolute top-1 left-1 w-6 h-6 rounded-full border border-white/20 shadow-md"
          initial={false}
          animate={{
            x: isDark ? 32 : 0,
            backgroundColor: isDark ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.7)",
            boxShadow: isDark
              ? "0 0 14px hsl(var(--primary) / 0.65), 0 2px 4px rgba(0,0,0,0.25)"
              : "0 2px 4px rgba(0,0,0,0.18)",
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="absolute top-1 left-1.5 w-2 h-1 bg-white/40 rounded-full blur-[1px]" />
        </motion.div>
      </motion.div>

      <span
        className={`flex items-center gap-1 text-[11px] font-bold tracking-wider transition-all duration-300 ${
          isDark
            ? "text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
            : "text-muted-foreground/40"
        }`}
      >
        <Moon className="w-3.5 h-3.5" /> DARK
      </span>
    </div>
  );
}
