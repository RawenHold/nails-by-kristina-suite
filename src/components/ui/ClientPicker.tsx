import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";

interface ClientPickerProps {
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}

/**
 * Premium client picker — a glass dropdown popover with search.
 * Shows up to 7 clients in the visible window; the rest scroll smoothly
 * with a soft fading edge mask and a custom liquid scrollbar.
 */
export default function ClientPicker({
  value,
  onChange,
  placeholder = "Выберите клиентку",
  allowEmpty = false,
  emptyLabel = "Без привязки",
  className,
}: ClientPickerProps) {
  const { data: clients } = useClients();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");
  const [maxH, setMaxH] = useState<number>(320);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = clients?.find((c) => c.id === value);

  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const compute = () => {
      const r = wrapRef.current!.getBoundingClientRect();
      const vh = window.innerHeight;
      const margin = 16;
      const below = vh - r.bottom - margin;
      const above = r.top - margin;
      const useTop = below < 240 && above > below;
      setPlacement(useTop ? "top" : "bottom");
      setMaxH(Math.max(200, Math.min(7 * 44 + 70, useTop ? above : below)));
    };
    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const list = clients ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((c) => c.full_name.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q));
  }, [clients, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open && value && listRef.current) {
      const el = listRef.current.querySelector<HTMLElement>(`[data-id="${value}"]`);
      el?.scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm",
          "flex items-center justify-between gap-2 transition-all",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          open && "ring-2 ring-primary/30",
        )}
      >
        <span className={cn("truncate text-left flex items-center gap-2", !selected && "text-muted-foreground")}>
          <UserRound className="w-4 h-4 shrink-0 opacity-70" />
          {selected ? selected.full_name : placeholder}
        </span>
        <ChevronDown
          className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "absolute left-0 right-0 mt-2 z-50 origin-top",
              "rounded-2xl border border-border/60 overflow-hidden",
              "bg-popover/90 backdrop-blur-2xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.25),0_0_0_1px_hsl(var(--border)/0.4)]",
            )}
            style={{
              backgroundImage:
                "linear-gradient(180deg, hsl(var(--popover)/0.92) 0%, hsl(var(--popover)/0.85) 100%)",
            }}
          >
            {/* iridescent top accent */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, hsl(var(--primary)/0.6), hsl(var(--accent)/0.6), transparent)",
              }}
            />

            {/* Search */}
            <div className="p-2 border-b border-border/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск клиентки..."
                  className="w-full h-10 pl-9 pr-9 rounded-xl bg-secondary/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>

            {/* List window — 7 visible items, scroll for more */}
            <div className="relative">
              <div
                ref={listRef}
                className="client-picker-scroll overflow-y-auto overscroll-contain p-1.5"
                style={{ maxHeight: "calc(7 * 44px + 12px)", scrollBehavior: "smooth" }}
              >
                {allowEmpty && (
                  <Row
                    label={emptyLabel}
                    muted
                    active={value === ""}
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  />
                )}

                {filtered.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">Ничего не найдено</div>
                )}

                {filtered.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: Math.min(i * 0.015, 0.15) }}
                  >
                    <Row
                      label={c.full_name}
                      sub={c.phone || undefined}
                      active={value === c.id}
                      dataId={c.id}
                      onClick={() => {
                        onChange(c.id);
                        setOpen(false);
                      }}
                    />
                  </motion.div>
                ))}
              </div>

              {/* fade edges */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-5"
                style={{ background: "linear-gradient(180deg, hsl(var(--popover)/0.9), transparent)" }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-5"
                style={{ background: "linear-gradient(0deg, hsl(var(--popover)/0.9), transparent)" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  sub,
  active,
  onClick,
  muted,
  dataId,
}: {
  label: string;
  sub?: string;
  active?: boolean;
  onClick: () => void;
  muted?: boolean;
  dataId?: string;
}) {
  return (
    <button
      type="button"
      data-id={dataId}
      onClick={onClick}
      className={cn(
        "w-full h-11 px-3 rounded-xl flex items-center gap-3 text-left transition-all",
        "hover:bg-primary/10 active:scale-[0.985]",
        active && "bg-primary/12",
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-semibold",
          active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
        )}
      >
        {muted ? "—" : label.trim().charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm truncate", muted ? "text-muted-foreground" : "text-foreground font-medium")}>
          {label}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
      </div>
      {active && <Check className="w-4 h-4 text-primary shrink-0" />}
    </button>
  );
}
