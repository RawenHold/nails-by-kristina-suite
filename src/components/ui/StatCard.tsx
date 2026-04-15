import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: number;
  className?: string;
  iconBg?: string;
}

export default function StatCard({ label, value, icon: Icon, trend, className, iconBg }: StatCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">{label}</span>
        {Icon && (
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", iconBg || "bg-primary/10")}>
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
        )}
      </div>
      <span className="text-base font-bold text-foreground leading-tight">{value}</span>
      {trend !== undefined && (
        <span
          className={cn(
            "text-[10px] font-semibold inline-flex items-center gap-0.5",
            trend >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      )}
    </GlassCard>
  );
}
