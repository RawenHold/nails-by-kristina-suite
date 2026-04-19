import { Home, CalendarDays, Users, Image, Timer, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", icon: Home, label: "Главная" },
  { path: "/calendar", icon: CalendarDays, label: "Календарь" },
  { path: "/clients", icon: Users, label: "Клиенты" },
  { path: "/gallery", icon: Image, label: "Галерея" },
  { path: "/timer", icon: Timer, label: "Таймер" },
  { path: "/finances", icon: Wallet, label: "Финансы" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 liquid-nav safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1 relative">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== "/" && location.pathname.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center min-w-[44px] h-full gap-0.5 transition-colors active:scale-95"
              aria-label={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute inset-x-1 top-1.5 bottom-1.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-[inset_0_1px_0_hsl(var(--glass-highlight)),0_4px_16px_hsl(var(--primary)/0.18)] backdrop-blur-md -z-10"
                  transition={{ type: "spring", stiffness: 480, damping: 34 }}
                />
              )}
              <tab.icon
                className={`w-[20px] h-[20px] transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              <span className={`text-[9px] font-medium transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
