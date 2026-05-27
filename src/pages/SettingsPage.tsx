import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { GlassSurface } from "@/components/ui/LiquidGlass";
import { User, Palette, Wrench, ShieldCheck, DatabaseBackup, LogOut, ChevronRight, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type Item = {
  to: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  tint: string; // hsl values
};

const ITEMS: Item[] = [
  { to: "/settings/profile",    icon: User,           label: "Профиль мастера",   desc: "Имя, логотип, контакты",     tint: "350 65% 55%" },
  { to: "/settings/appearance", icon: Palette,        label: "Внешний вид",       desc: "Тема и цветовая палитра",    tint: "280 70% 60%" },
  { to: "/settings/catalog",    icon: Wrench,         label: "Услуги и категории", desc: "Прайс, длительность, категории расходов", tint: "200 80% 55%" },
  { to: "/settings/backup",     icon: DatabaseBackup, label: "Резервная копия",   desc: "Экспорт и восстановление",   tint: "38 90% 55%" },
  { to: "/settings/security",   icon: ShieldCheck,    label: "Безопасность",      desc: "Смена пароля",               tint: "0 70% 55%" },
];

export default function SettingsPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div>
      <PageHeader title="Настройки" showBack />
      <div className="px-4 space-y-2.5 pb-nav">
        {ITEMS.map((item, i) => (
          <motion.button
            key={item.to}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(item.to)}
            className="w-full text-left"
          >
            <GlassSurface
              className="rounded-2xl"
              style={{ boxShadow: `0 6px 18px hsl(${item.tint} / 0.12)` }}
            >
              <div className="flex items-center gap-3 px-3.5 py-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: `hsl(${item.tint} / 0.15)`,
                    color: `hsl(${item.tint})`,
                  }}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-tight">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </GlassSurface>
          </motion.button>
        ))}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSignOut}
          className="w-full h-12 mt-4 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Выйти
        </motion.button>
      </div>
    </div>
  );
}
