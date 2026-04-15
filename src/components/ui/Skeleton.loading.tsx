import { cn } from "@/lib/utils";

interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className }: SkeletonBlockProps) {
  return <div className={cn("shimmer rounded-2xl", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-11 h-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-3/4 rounded-lg" />
          <SkeletonBlock className="h-2.5 w-1/2 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass-card rounded-2xl p-4 space-y-2">
      <SkeletonBlock className="h-2.5 w-16 rounded-lg" />
      <SkeletonBlock className="h-5 w-24 rounded-lg" />
    </div>
  );
}

export function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="px-4 space-y-3 pt-4">
      <div className="grid grid-cols-2 gap-3">
        <StatSkeleton />
        <StatSkeleton />
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
