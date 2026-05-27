import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimePickerProps {
  hour: string;
  minute: string;
  onChange: (hour: string, minute: string) => void;
  hours?: number[];
  minutes?: string[];
  className?: string;
}

const ITEM_H = 40; // px — height of each wheel item

/**
 * iOS-style time wheel picker.
 * Two scroll-snap columns (hours + minutes) with a highlighted center row,
 * fading edges and inertial snapping — like the iOS alarm/timer wheel.
 */
export default function TimePicker({
  hour,
  minute,
  onChange,
  hours = Array.from({ length: 14 }, (_, i) => i + 8),
  minutes = ["00", "15", "30", "45"],
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const compute = () => {
      const r = wrapRef.current!.getBoundingClientRect();
      const vh = window.innerHeight;
      const popH = 5 * ITEM_H + 80;
      setPlacement(vh - r.bottom - 16 < popH && r.top - 16 > vh - r.bottom - 16 ? "top" : "bottom");
    };
    compute();
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("resize", compute);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("resize", compute);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full h-11 px-3 rounded-2xl bg-secondary/70 text-foreground text-sm",
          "flex items-center justify-between gap-2 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          open && "ring-2 ring-primary/30",
        )}
      >
        <span className="flex items-center gap-2 font-medium tabular-nums">
          <Clock className="w-4 h-4 opacity-60" />
          {hour}:{minute}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute left-0 right-0 z-50",
              placement === "bottom" ? "top-full mt-2 origin-top" : "bottom-full mb-2 origin-bottom",
              "rounded-2xl border border-border/60 overflow-hidden",
              "bg-popover/90 backdrop-blur-2xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_0_1px_hsl(var(--border)/0.4)]",
            )}
            style={{
              backgroundImage:
                "linear-gradient(180deg, hsl(var(--popover)/0.92) 0%, hsl(var(--popover)/0.85) 100%)",
            }}
          >
            <div className="px-3 pt-3 pb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Время</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">{hour}:{minute}</span>
            </div>

            <div className="relative px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                <Wheel
                  values={hours.map((h) => h.toString().padStart(2, "0"))}
                  value={hour}
                  onChange={(v) => onChange(v, minute)}
                />
                <Wheel values={minutes} value={minute} onChange={(v) => onChange(hour, v)} />
              </div>

              {/* center highlight band */}
              <div
                aria-hidden
                className="pointer-events-none absolute left-3 right-3 top-1/2 -translate-y-1/2 rounded-xl"
                style={{
                  height: ITEM_H,
                  background:
                    "linear-gradient(90deg, hsl(var(--primary)/0.10), hsl(var(--accent)/0.10))",
                  boxShadow: "inset 0 1px 0 hsl(var(--border)/0.5), inset 0 -1px 0 hsl(var(--border)/0.5)",
                }}
              />

              {/* fade masks */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-3 top-0 h-12"
                style={{ background: "linear-gradient(180deg, hsl(var(--popover)) 5%, transparent)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-3 bottom-0 h-12"
                style={{ background: "linear-gradient(0deg, hsl(var(--popover)) 5%, transparent)" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Wheel({
  values,
  value,
  onChange,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const programmatic = useRef(false);

  // Scroll to active on mount / when value changes externally
  useEffect(() => {
    const idx = Math.max(0, values.indexOf(value));
    if (!ref.current) return;
    programmatic.current = true;
    ref.current.scrollTo({ top: idx * ITEM_H, behavior: "auto" });
    const t = window.setTimeout(() => (programmatic.current = false), 50);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleScroll = useCallback(() => {
    if (programmatic.current || !ref.current) return;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.round(ref.current.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      const snapTop = clamped * ITEM_H;
      ref.current.scrollTo({ top: snapTop, behavior: "smooth" });
      const next = values[clamped];
      if (next !== value) onChange(next);
    }, 90);
  }, [values, value, onChange]);

  // Five rows visible: 2 above, center, 2 below
  const padRows = 2;

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="relative overflow-y-scroll no-scrollbar snap-y snap-mandatory rounded-xl"
      style={{
        height: ITEM_H * 5,
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <div style={{ height: ITEM_H * padRows }} />
      {values.map((v) => {
        const active = v === value;
        return (
          <button
            type="button"
            key={v}
            onClick={() => onChange(v)}
            className={cn(
              "w-full flex items-center justify-center snap-center tabular-nums transition-all",
              active ? "text-foreground font-semibold text-xl" : "text-muted-foreground/70 text-base",
            )}
            style={{ height: ITEM_H }}
          >
            {v}
          </button>
        );
      })}
      <div style={{ height: ITEM_H * padRows }} />
    </div>
  );
}
