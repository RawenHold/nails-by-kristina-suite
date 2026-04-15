import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  showBack?: boolean;
}

export default function PageHeader({ title, subtitle, action, showBack }: PageHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-40 glass-header px-4 safe-top pb-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground text-display truncate">{title}</h1>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {action}
      </div>
    </div>
  );
}
