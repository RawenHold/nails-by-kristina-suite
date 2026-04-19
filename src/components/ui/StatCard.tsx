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
    <GlassCard className={cn("relative overflow-hidden flex flex-col gap-1.5", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-40 blur-2xl"
        style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.25), transparent 70%)" }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground font-medium tracking-wide uppercase">{label}</span>
        {Icon && (
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shadow-sm", iconBg || "bg-primary/10")}>
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
        )}
      </div>
      <span className="relative text-base font-bold text-foreground leading-tight">{value}</span>
      {trend !== undefined && (
        <span
          className={cn(
            "relative text-[10px] font-semibold inline-flex items-center gap-0.5",
            trend >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </span>
      )}
    </GlassCard>
  );
}
