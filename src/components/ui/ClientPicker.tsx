import { type RefObject, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  inlineDropdown?: boolean;
}

interface PopRect {
  left: number;
  width: number;
  top: number; // resolved top of popover
  maxH: number;
  placement: "bottom" | "top";
  triggerTop: number;
  triggerBottom: number;
}

/**
 * Premium client picker — glass dropdown rendered into a portal with
 * fixed positioning so it never gets clipped by bottom sheets or sticky
 * action bars. Search is available but never auto-focused.
 */
export default function ClientPicker({
  value,
  onChange,
  placeholder = "Выберите клиентку",
  allowEmpty = false,
  emptyLabel = "Без привязки",
  className,
  inlineDropdown = false,
}: ClientPickerProps) {
  const { data: clients } = useClients();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<PopRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = clients?.find((c) => c.id === value);

  const compute = () => {
    if (inlineDropdown) return;
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const margin = 12;
    // Detect a sticky bottom action bar inside an open bottom sheet so we
    // never overlap "Создать запись" and similar primary CTAs.
    let bottomBoundary = vh - margin;
    const sheet = wrapRef.current.closest('[data-bottom-sheet="open"]') as HTMLElement | null;
    if (sheet) {
      const footer = sheet.querySelector<HTMLElement>(":scope .absolute > div:last-child > div");
      // Generic: find the deepest sticky/border-t footer inside the sheet
      const candidates = sheet.querySelectorAll<HTMLElement>(".border-t");
      candidates.forEach((c) => {
        const cr = c.getBoundingClientRect();
        if (cr.top > r.bottom && cr.top < bottomBoundary) bottomBoundary = cr.top - 8;
      });
      void footer;
    }
    const below = bottomBoundary - r.bottom - 8;
    const above = r.top - margin;
    const useTop = below < 220 && above > below;
    const maxH = Math.max(180, Math.min(7 * 44 + 70, useTop ? above : below));
    setRect({
      left: r.left,
      width: r.width,
      top: useTop ? r.top - 8 - maxH : r.bottom + 8,
      maxH,
      placement: useTop ? "top" : "bottom",
      triggerTop: r.top,
      triggerBottom: r.bottom,
    });
  };

  useLayoutEffect(() => {
    if (!open || inlineDropdown) return;
    compute();
    const onResize = () => compute();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inlineDropdown]);

  const filtered = useMemo(() => {
    const list = clients ?? [];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((c) => c.full_name.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q));
  }, [clients, query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
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

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

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

      {inlineDropdown ? (
        <AnimatePresence>
          {open && (
            <motion.div
              ref={popRef}
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "relative z-10 mt-2 rounded-2xl border border-border/60 overflow-hidden",
                "bg-popover/90 backdrop-blur-2xl shadow-[0_18px_45px_-18px_hsl(var(--primary)/0.35),0_0_0_1px_hsl(var(--border)/0.4)]",
              )}
              style={{
                backgroundImage:
                  "linear-gradient(180deg, hsl(var(--popover)/0.95) 0%, hsl(var(--popover)/0.88) 100%)",
              }}
            >
              <ClientListContent
                query={query}
                setQuery={setQuery}
                listRef={listRef}
                maxHeight={7 * 44}
                allowEmpty={allowEmpty}
                emptyLabel={emptyLabel}
                value={value}
                filtered={filtered}
                onPick={(id) => {
                  onChange(id);
                  setOpen(false);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && rect && (
              <motion.div
                ref={popRef}
                initial={{ opacity: 0, y: rect.placement === "bottom" ? -6 : 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: rect.placement === "bottom" ? -4 : 4, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: "fixed",
                  left: rect.left,
                  top: rect.top,
                  width: rect.width,
                  zIndex: 100,
                  transformOrigin: rect.placement === "bottom" ? "top center" : "bottom center",
                  backgroundImage:
                    "linear-gradient(180deg, hsl(var(--popover)/0.95) 0%, hsl(var(--popover)/0.88) 100%)",
                }}
                className={cn(
                  "rounded-2xl border border-border/60 overflow-hidden",
                  "bg-popover/90 backdrop-blur-2xl shadow-[0_24px_70px_-18px_hsl(var(--primary)/0.35),0_0_0_1px_hsl(var(--border)/0.4)]",
                )}
              >
                <ClientListContent
                  query={query}
                  setQuery={setQuery}
                  listRef={listRef}
                  maxHeight={rect.maxH}
                  allowEmpty={allowEmpty}
                  emptyLabel={emptyLabel}
                  value={value}
                  filtered={filtered}
                  onPick={(id) => {
                    onChange(id);
                    setOpen(false);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )
      )}
    </div>
  );
}

function ClientListContent({
  query,
  setQuery,
  listRef,
  maxHeight,
  allowEmpty,
  emptyLabel,
  value,
  filtered,
  onPick,
}: {
  query: string;
  setQuery: (value: string) => void;
  listRef: RefObject<HTMLDivElement>;
  maxHeight: number;
  allowEmpty: boolean;
  emptyLabel: string;
  value: string;
  filtered: Array<{ id: string; full_name: string; phone?: string | null }>;
  onPick: (id: string) => void;
}) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--primary)/0.6), hsl(var(--accent)/0.6), transparent)",
        }}
      />

      <div className="p-2 border-b border-border/40">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
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

      <div className="relative">
        <div
          ref={listRef}
          className="client-picker-scroll overflow-y-auto overscroll-contain p-1.5"
          style={{ maxHeight, scrollBehavior: "smooth" }}
        >
          {allowEmpty && (
            <Row label={emptyLabel} muted active={value === ""} onClick={() => onPick("")} />
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
                onClick={() => onPick(c.id)}
              />
            </motion.div>
          ))}
        </div>

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
    </>
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
