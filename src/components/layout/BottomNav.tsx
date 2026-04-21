import { LayoutGrid, CalendarDays, Users, Images, Timer, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", icon: LayoutGrid, label: "Главная" },
  { path: "/calendar", icon: CalendarDays, label: "Календарь" },
  { path: "/clients", icon: Users, label: "Клиенты" },
  { path: "/gallery", icon: Images, label: "Галерея" },
  { path: "/timer", icon: Timer, label: "Таймер" },
  { path: "/finances", icon: Wallet, label: "Финансы" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom border-t border-border/40">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path !== "/" && location.pathname.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center min-w-[44px] h-full gap-0.5"
              aria-label={tab.label}
            >
              <div className="relative h-7 flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="bottomNavPill"
                    className="absolute inset-0 w-12 -mx-1 rounded-full bg-primary/12"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <tab.icon
                  className={`relative w-[19px] h-[19px] transition-colors duration-200 ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  strokeWidth={isActive ? 2.1 : 1.7}
                />
              </div>
              <span
                className={`text-[9.5px] font-medium tracking-tight transition-colors duration-200 ${
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
