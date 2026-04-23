import { ReactNode } from "react";
import { ArrowLeft, Settings, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import HeaderScene from "@/components/layout/HeaderScene";
import { useSideMenu } from "@/contexts/SideMenuContext";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  showBack?: boolean;
  hideSettings?: boolean;
  /**
   * When true, renders an animated weather scene background filling the
   * header area instead of the logo + title block. Used on the home screen.
   * Scene headers are NOT sticky — they scroll away with content.
   */
  scene?: boolean;
  /**
   * When true, shows a hamburger button on the left that opens the side menu.
   */
  showMenu?: boolean;
}

export default function PageHeader({ title, subtitle, action, showBack, hideSettings, scene, showMenu }: PageHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettings = location.pathname === "/settings";
  const { openMenu } = useSideMenu();

  if (scene) {
    return (
      <div className="px-4 pt-[max(env(safe-area-inset-top,0px),0.5rem)] pb-2 mb-2">
        <div className="relative h-20 rounded-3xl overflow-hidden border border-glass-border shadow-[var(--glass-shadow)]">
          <HeaderScene />
          {showMenu && (
            <button
              onClick={openMenu}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-2xl bg-background/40 backdrop-blur-md flex items-center justify-center active:scale-90 border border-white/20 z-10"
              aria-label="Меню"
            >
              <Menu className="w-4 h-4 text-white drop-shadow" />
            </button>
          )}
          {/* Logo + title centered */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none">
            <img src={logo} alt="K Nails" className="w-7 h-7 drop-shadow-md" />
            <span className="text-sm font-display font-semibold text-white drop-shadow-md tracking-wide">
              K Nails
            </span>
          </div>
          {action && <div className="absolute bottom-1 right-2 z-10">{action}</div>}
        </div>
        {subtitle && (
          <p className="text-xs font-medium text-muted-foreground mt-2 px-1">{subtitle}</p>
        )}
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 glass-header px-4 safe-top pb-4 mb-3">
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
          {!showBack && showMenu && (
            <button
              onClick={openMenu}
              className="w-9 h-9 rounded-2xl glass-button flex items-center justify-center shrink-0 active:scale-90"
              aria-label="Меню"
            >
              <Menu className="w-4 h-4 text-foreground" />
            </button>
          )}
          {!showBack && !showMenu && (
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
