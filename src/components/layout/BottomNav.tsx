import { LayoutGrid, CalendarDays, Users, Images, Timer, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { path: "/", icon: LayoutGrid, label: "Главная" },
  { path: "/calendar", icon: CalendarDays, label: "Календарь" },
  { path: "/clients", icon: Users, label: "Клиенты" },
  { path: "/gallery", icon: Images, label: "Галерея" },
  { path: "/timer", icon: Timer, label: "Таймер" },
  { path: "/finances", icon: Wallet, label: "Финансы" },
];

/**
 * Bottom navigation with "spotlight" effect — a soft beam of light drops
 * from above the active tab and a thin top indicator line slides between
 * positions. Inactive tabs receive a fading spotlight based on distance
 * from the active one for a cinematic feel.
 */
export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) =>
      t.path === "/" ? location.pathname === "/" : location.pathname.startsWith(t.path),
    ),
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom border-t border-border/40">
      <div
        className="relative grid grid-cols-6 items-stretch h-14 max-w-lg mx-auto px-1"
        style={{ ["--tabs" as any]: tabs.length }}
      >
        {/* Sliding top indicator line */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 h-[2px] rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.7)] transition-[left,width] duration-[400ms] ease-out"
          style={{
            left: `calc(${(activeIndex + 0.5) * (100 / tabs.length)}% - 14px)`,
            width: "28px",
          }}
        />

        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          const distance = Math.abs(activeIndex - i);
          const spotlight = isActive ? 1 : Math.max(0, 1 - distance * 0.55);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 outline-none"
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Spotlight beam */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/3 w-14 h-20 rounded-full blur-2xl transition-opacity duration-[400ms]"
                style={{
                  background:
                    "radial-gradient(ellipse at top, hsl(var(--primary) / 0.55) 0%, hsl(var(--primary) / 0.18) 35%, transparent 70%)",
                  opacity: spotlight,
                  transitionDelay: isActive ? "0.1s" : "0s",
                }}
              />
              <div className="relative h-7 flex items-center justify-center">
                <tab.icon
                  className={`relative w-[20px] h-[20px] transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.4 : 1.75}
                />
              </div>
              <span
                className={`relative text-[9.5px] font-medium tracking-tight transition-colors duration-200 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
