import GlassCard from "./GlassCard";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  trend?: number;
  className?: string;
}

export default function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <GlassCard className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
      </div>
      <span className="text-lg font-semibold text-foreground">{value}</span>
      {trend !== undefined && (
        <span
          className={cn(
            "text-[10px] font-medium",
            trend >= 0 ? "text-success" : "text-destructive"
          )}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs last month
        </span>
      )}
    </GlassCard>
  );
}
