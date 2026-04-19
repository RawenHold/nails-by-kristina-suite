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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path !== "/" && location.pathname.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center justify-center min-w-[44px] h-full gap-0.5 transition-colors"
              aria-label={tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 w-7 h-[2.5px] rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <tab.icon
                className={`w-[20px] h-[20px] transition-colors duration-200 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                strokeWidth={isActive ? 2.2 : 1.8}
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
