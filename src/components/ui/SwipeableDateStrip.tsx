import { useEffect, useMemo, useRef } from "react";
import { addDays, isSameDay, startOfWeek, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMonthAppointments } from "@/hooks/useMonthAppointments";

interface SwipeableDateStripProps {
  value: Date;
  onChange: (d: Date) => void;
  /** How many days to render in total (centered around `value`). */
  range?: number;
}

/**
 * Horizontally scrollable, snap-to-day date strip.
 * Shows ~7 days at once on mobile but lets the user fling/swipe through many weeks smoothly.
 * Includes appointment dots (planned / completed) to match the picker legend.
 */
export default function SwipeableDateStrip({ value, onChange, range = 90 }: SwipeableDateStripProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Center the rendered window on the *current week start* so the strip always shows full weeks.
  const anchor = useMemo(() => startOfWeek(value, { weekStartsOn: 1 }), [value]);
  const half = Math.floor(range / 2);
  const days = useMemo(
    () => Array.from({ length: range }, (_, i) => addDays(anchor, i - half)),
    [anchor, range, half]
  );

  // Fetch month markers for the visible value's month (cheap, cached per month).
  const { data: monthMap } = useMonthAppointments(startOfMonth(value));

  // Auto-scroll selected day into view on mount and when `value` changes.
  useEffect(() => {
    const key = format(value, "yyyy-MM-dd");
    const el = itemRefs.current.get(key);
    const scroller = scrollerRef.current;
    if (!el || !scroller) return;
    const target = el.offsetLeft - scroller.clientWidth / 2 + el.clientWidth / 2;
    scroller.scrollTo({ left: target, behavior: "smooth" });
  }, [value]);

  const today = new Date();

  return (
    <div
      ref={scrollerRef}
      data-no-swipe-nav
      className="overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 scroll-smooth overscroll-x-contain"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div className="flex gap-1.5 py-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const isSelected = isSameDay(day, value);
          const isToday = isSameDay(day, today);
          const info = monthMap?.get(key);

          return (
            <button
              key={key}
              ref={(el) => {
                if (el) itemRefs.current.set(key, el);
                else itemRefs.current.delete(key);
              }}
              onClick={() => onChange(day)}
              className={cn(
                "snap-center shrink-0 w-[52px] flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200 active:scale-95",
                isSelected && "bg-primary shadow-sm shadow-primary/25",
                !isSelected && isToday && "bg-primary/10",
                !isSelected && !isToday && "bg-transparent hover:bg-secondary/50"
              )}
              aria-label={format(day, "EEEE d MMMM", { locale: ru })}
            >
              <span
                className={cn(
                  "text-[10px] font-medium uppercase",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground"
                )}
              >
                {format(day, "EEE", { locale: ru })}
              </span>
              <span
                className={cn(
                  "text-sm font-bold",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {format(day, "d")}
              </span>
              {/* Marker dot */}
              <span
                className={cn(
                  "w-1 h-1 rounded-full transition-colors",
                  isSelected
                    ? "bg-primary-foreground/80"
                    : info?.hasActive
                    ? "bg-primary"
                    : info?.hasCompleted
                    ? "bg-emerald-500"
                    : isToday
                    ? "bg-primary/60"
                    : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
