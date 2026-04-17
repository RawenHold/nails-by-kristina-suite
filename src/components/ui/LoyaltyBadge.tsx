import { cn } from "@/lib/utils";
import { Crown, Award, Star, Medal } from "lucide-react";

const config = {
  bronze: { icon: Medal, bg: "bg-amber-100/80 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400", label: "Бронза" },
  silver: { icon: Award, bg: "bg-slate-100/80 dark:bg-slate-800/40", text: "text-slate-600 dark:text-slate-300", label: "Серебро" },
  gold: { icon: Star, bg: "bg-amber-50 dark:bg-yellow-900/30", text: "text-amber-600 dark:text-yellow-400", label: "Золото" },
  vip: { icon: Crown, bg: "bg-primary/10", text: "text-primary", label: "VIP" },
};

interface LoyaltyBadgeProps {
  level: keyof typeof config;
  showLabel?: boolean;
}

export default function LoyaltyBadge({ level, showLabel = true }: LoyaltyBadgeProps) {
  const c = config[level];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold", c.bg, c.text)}>
      <c.icon className="w-3 h-3" />
      {showLabel && c.label}
    </span>
  );
}
