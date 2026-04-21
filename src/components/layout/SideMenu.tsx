import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Settings, LogOut, Wallet, Image as ImageIcon, CalendarDays, Users, Timer, Phone, Send, Instagram, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMasterProfile } from "@/hooks/useMasterProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: profile } = useMasterProfile();

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleSignOut = async () => {
    onClose();
    try {
      await signOut();
    } catch (e) {
      console.error(e);
    }
  };

  const initials = (profile?.display_name || user?.email || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const workSection = [
    { icon: CalendarDays, label: "Календарь", path: "/calendar" },
    { icon: Users, label: "Клиенты", path: "/clients" },
  ];
  const contentSection = [
    { icon: ImageIcon, label: "Галерея", path: "/gallery" },
    { icon: Timer, label: "Таймер", path: "/timer" },
  ];
  const financeSection = [
    { icon: Wallet, label: "Финансы", path: "/finances" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.4, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -300) onClose();
            }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed top-0 left-0 bottom-0 z-[81] w-[82%] max-w-[320px] glass-sheet rounded-r-3xl flex flex-col safe-top"
          >
            <div className="relative px-5 pt-4 pb-5 border-b border-glass-border">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center active:scale-90"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 ring-2 ring-primary/20">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="avatar" />}
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {initials || <UserIcon className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-foreground truncate">
                    {profile?.display_name || "Мастер"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </div>
                </div>
              </div>

              {(profile?.phone || profile?.instagram || profile?.telegram) && (
                <div className="flex items-center gap-2 mt-4">
                  {profile?.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-2xl bg-secondary/70 text-xs font-medium active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" /> Звонок
                    </a>
                  )}
                  {profile?.telegram && (
                    <a
                      href={`https://t.me/${profile.telegram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-2xl bg-secondary/70 text-xs font-medium active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" /> Telegram
                    </a>
                  )}
                  {profile?.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-2xl bg-secondary/70 text-xs font-medium active:scale-95"
                    >
                      <Instagram className="w-3.5 h-3.5" /> Insta
                    </a>
                  )}
                </div>
              )}
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
              {[
                { label: "Работа", items: workSection },
                { label: "Контент", items: contentSection },
                { label: "Финансы", items: financeSection },
              ].map((section) => (
                <div key={section.label}>
                  <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {section.label}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((it) => (
                      <button
                        key={it.path}
                        onClick={() => go(it.path)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl active:bg-secondary/70 transition-colors text-left"
                      >
                        <div className="liquid-glass liquid-glass-active w-9 h-9 rounded-2xl flex items-center justify-center">
                          <it.icon className="w-4 h-4 text-primary relative z-10" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{it.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Аккаунт
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => go("/settings")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl active:bg-secondary/70 transition-colors text-left"
                  >
                    <div className="liquid-glass w-9 h-9 rounded-xl flex items-center justify-center">
                      <Settings className="w-4 h-4 text-foreground/80 relative z-10" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Настройки</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl active:bg-destructive/10 transition-colors text-left"
                  >
                    <div className="liquid-glass w-9 h-9 rounded-xl flex items-center justify-center" style={{ boxShadow: "inset 0 1px 0 hsl(var(--glass-highlight)), inset 0 -6px 12px hsl(var(--destructive) / 0.18), 0 4px 14px hsl(var(--destructive) / 0.12)" }}>
                      <LogOut className="w-4 h-4 text-destructive relative z-10" />
                    </div>
                    <span className="text-sm font-medium text-destructive">Выйти</span>
                  </button>
                </div>
              </div>
            </nav>

            <div className="px-5 pb-[max(env(safe-area-inset-bottom,0px),1rem)] pt-2 text-[10px] text-muted-foreground/70 text-center">
              K Nails Finance
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
