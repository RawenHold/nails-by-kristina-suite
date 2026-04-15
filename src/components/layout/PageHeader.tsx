import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-40 glass-nav px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground font-display">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </div>
  );
}
