import { LayoutGrid, CalendarDays, Users, Images, Timer, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const tabs = [
  { path: "/", icon: LayoutGrid, label: "Главная", color: "350 65% 55%" },
  { path: "/calendar", icon: CalendarDays, label: "Календарь", color: "210 80% 58%" },
  { path: "/clients", icon: Users, label: "Клиенты", color: "270 65% 60%" },
  { path: "/gallery", icon: Images, label: "Галерея", color: "330 70% 60%" },
  { path: "/timer", icon: Timer, label: "Таймер", color: "38 85% 55%" },
  { path: "/finances", icon: Wallet, label: "Финансы", color: "152 60% 45%" },
];

/**
 * Bottom navigation with cinematic glow burst on switch + sliding indicator.
 * Inspired by glow-menu prompt — a radial colored aura sweeps in when a tab
 * becomes active, the icon flips with rotateX, and a soft halo lingers below.
 */
export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) =>
      t.path === "/" ? location.pathname === "/" : location.pathname.startsWith(t.path),
    ),
  );

  const activeColor = tabs[activeIndex].color;
  const [burstKey, setBurstKey] = useState(activeIndex);
  useEffect(() => {
    setBurstKey((k) => k + 1);
  }, [activeIndex]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom border-t border-border/40 overflow-hidden">
      {/* Ambient nav glow that tints from active tab */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{
          background: `radial-gradient(120% 140% at ${(activeIndex + 0.5) * (100 / tabs.length)}% 110%, hsl(${activeColor} / 0.28) 0%, hsl(${activeColor} / 0.10) 35%, transparent 70%)`,
        }}
        transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
      />

      <div
        ref={navRef}
        className="relative grid grid-cols-6 items-stretch h-14 max-w-lg mx-auto px-1"
        style={{ ["--tabs" as any]: tabs.length }}
      >
        {/* Sliding top indicator line */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 h-[2px] rounded-full"
          animate={{
            left: `calc(${(activeIndex + 0.5) * (100 / tabs.length)}% - 14px)`,
            background: `linear-gradient(90deg, transparent, hsl(${activeColor}), transparent)`,
            boxShadow: `0 0 12px hsl(${activeColor} / 0.85)`,
          }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          style={{ width: "28px" }}
        />

        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 outline-none"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Persistent halo on active tab */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    key={`halo-${burstKey}`}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 w-16 h-20 rounded-full blur-2xl"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                    style={{
                      background: `radial-gradient(ellipse at top, hsl(${tab.color} / 0.7) 0%, hsl(${tab.color} / 0.22) 40%, transparent 70%)`,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Burst ring that fires once on activation */}
              <AnimatePresence>
                {isActive && (
                  <motion.span
                    key={`burst-${burstKey}`}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full"
                    initial={{ opacity: 0.7, scale: 0.2, width: 8, height: 8, x: "-50%" }}
                    animate={{ opacity: 0, scale: 1, width: 56, height: 56, x: "-50%" }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    style={{
                      background: `radial-gradient(circle, hsl(${tab.color} / 0.55) 0%, hsl(${tab.color} / 0.15) 50%, transparent 70%)`,
                    }}
                  />
                )}
              </AnimatePresence>

              <div className="relative h-7 flex items-center justify-center" style={{ perspective: 600 }}>
                <motion.div
                  animate={{
                    rotateX: isActive ? [90, 0] : 0,
                    scale: isActive ? [0.7, 1.08, 1] : 1,
                  }}
                  transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  <tab.icon
                    className="relative w-[20px] h-[20px] transition-colors duration-300"
                    strokeWidth={isActive ? 2.4 : 1.75}
                    style={{
                      color: isActive ? `hsl(${tab.color})` : "hsl(var(--muted-foreground))",
                      filter: isActive ? `drop-shadow(0 0 6px hsl(${tab.color} / 0.7))` : "none",
                    }}
                  />
                </motion.div>
              </div>
              <motion.span
                className="relative text-[9.5px] font-medium tracking-tight transition-colors duration-300"
                animate={{ y: isActive ? -1 : 0 }}
                style={{
                  color: isActive ? `hsl(${tab.color})` : "hsl(var(--muted-foreground))",
                  textShadow: isActive ? `0 0 10px hsl(${tab.color} / 0.4)` : "none",
                }}
              >
                {tab.label}
              </motion.span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
