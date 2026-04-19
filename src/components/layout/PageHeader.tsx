import { ReactNode } from "react";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.svg";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  showBack?: boolean;
  hideSettings?: boolean;
}

export default function PageHeader({ title, subtitle, action, showBack, hideSettings }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettings = location.pathname === "/settings";

  return (
    <div className="sticky top-0 z-40 glass-header px-4 safe-top pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-2xl glass-button flex items-center justify-center shrink-0 active:scale-90"
              aria-label="Назад"
            >
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          {!showBack && (
            <img src={logo} alt="K Nails Finance" className="w-8 h-8 shrink-0 drop-shadow-sm" />
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground text-display truncate leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {action}
          {!hideSettings && !isSettings && (
            <button
              onClick={() => navigate("/settings")}
              className="w-9 h-9 rounded-2xl glass-button flex items-center justify-center active:scale-90"
              aria-label="Настройки"
            >
              <Settings className="w-4 h-4 text-foreground/70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
