import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  elevated?: boolean;
}

export default function GlassCard({ children, className, onClick, elevated }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        elevated ? "glass-card-elevated" : "glass-card",
        "rounded-2xl p-4 transition-all duration-200 active:scale-[0.985]",
        onClick && "cursor-pointer hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}
