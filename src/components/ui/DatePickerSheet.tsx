import { useState, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { format, setMonth, setYear, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMonthAppointments } from "@/hooks/useMonthAppointments";

interface DatePickerSheetProps {
  value: Date;
  onChange: (d: Date) => void;
}

const monthsShort = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];

export default function DatePickerSheet({ value, onChange }: DatePickerSheetProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(value));
  const [pickMode, setPickMode] = useState<"day" | "month" | "year">("day");

  const { data: monthMap } = useMonthAppointments(viewMonth);

  const modifiers = useMemo(() => {
    if (!monthMap) return {};
    const withActive: Date[] = [];
    const withCompleted: Date[] = [];
    for (const [key, info] of monthMap.entries()) {
      const [y, m, d] = key.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      if (info.hasActive) withActive.push(date);
      else if (info.hasCompleted) withCompleted.push(date);
    }
    return { hasActive: withActive, hasCompleted: withCompleted };
  }, [monthMap]);

  const yearStart = Math.floor(viewMonth.getFullYear() / 12) * 12;

  return (
    <>
      <button
        onClick={() => { setViewMonth(startOfMonth(value)); setPickMode("day"); setOpen(true); }}
        className="h-9 px-3 rounded-2xl glass-button flex items-center gap-2 active:scale-[0.98]"
        aria-label="Открыть календарь"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground capitalize">
          {format(value, "LLLL yyyy", { locale: ru })}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass-card-elevated rounded-3xl p-4"
            >
              {/* Header — 3-column grid keeps title perfectly centered */}
              <div className="grid grid-cols-[auto,1fr,auto] items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    if (pickMode === "day") setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
                    else if (pickMode === "month") setViewMonth(d => new Date(d.getFullYear() - 1, d.getMonth(), 1));
                    else setViewMonth(d => new Date(d.getFullYear() - 12, d.getMonth(), 1));
                  }}
                  className="w-9 h-9 rounded-xl glass-button flex items-center justify-center active:scale-90"
                  aria-label="Назад"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPickMode(m => m === "day" ? "month" : m === "month" ? "year" : "day")}
                  className="h-9 mx-auto px-4 rounded-xl bg-primary/8 text-foreground font-display font-semibold text-sm capitalize active:scale-95 truncate max-w-full"
                >
                  {pickMode === "day" && format(viewMonth, "LLLL yyyy", { locale: ru })}
                  {pickMode === "month" && format(viewMonth, "yyyy")}
                  {pickMode === "year" && `${yearStart} – ${yearStart + 11}`}
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (pickMode === "day") setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
                      else if (pickMode === "month") setViewMonth(d => new Date(d.getFullYear() + 1, d.getMonth(), 1));
                      else setViewMonth(d => new Date(d.getFullYear() + 12, d.getMonth(), 1));
                    }}
                    className="w-9 h-9 rounded-xl glass-button flex items-center justify-center active:scale-90"
                    aria-label="Вперёд"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-9 h-9 rounded-xl glass-button flex items-center justify-center active:scale-90"
                    aria-label="Закрыть"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day picker */}
              {pickMode === "day" && (
                <DayPicker
                  mode="single"
                  selected={value}
                  month={viewMonth}
                  onMonthChange={setViewMonth}
                  onSelect={(d) => { if (d) { onChange(d); setOpen(false); } }}
                  weekStartsOn={1}
                  locale={ru}
                  showOutsideDays
                  modifiers={modifiers}
                  modifiersClassNames={{
                    hasActive: "has-apt-active",
                    hasCompleted: "has-apt-completed",
                  }}
                  classNames={{
                    months: "flex flex-col",
                    month: "space-y-2",
                    caption: "hidden",
                    table: "w-full border-collapse",
                    head_row: "flex",
                    head_cell: "text-muted-foreground w-10 h-8 flex items-center justify-center font-medium text-[10px] uppercase",
                    row: "flex w-full mt-1",
                    cell: "relative w-10 h-10 text-center text-sm p-0",
                    day: cn(
                      "w-10 h-10 rounded-2xl font-medium text-sm transition-all",
                      "hover:bg-primary/10 active:scale-95 relative pointer-events-auto"
                    ),
                    day_selected: "!bg-primary !text-primary-foreground shadow-md shadow-primary/25",
                    day_today: "ring-1 ring-primary/40 text-primary font-bold",
                    day_outside: "text-muted-foreground/40",
                    day_disabled: "opacity-30",
                  }}
                />
              )}

              {/* Month picker */}
              {pickMode === "month" && (
                <div className="grid grid-cols-3 gap-2">
                  {monthsShort.map((m, i) => {
                    const isSelected = value.getMonth() === i && value.getFullYear() === viewMonth.getFullYear();
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          setViewMonth(setMonth(viewMonth, i));
                          setPickMode("day");
                        }}
                        className={cn(
                          "h-12 rounded-2xl text-sm font-medium transition-all active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "bg-secondary/60 text-foreground hover:bg-secondary"
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Year picker */}
              {pickMode === "year" && (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 12 }, (_, i) => yearStart + i).map(y => {
                    const isSelected = value.getFullYear() === y;
                    return (
                      <button
                        key={y}
                        onClick={() => { setViewMonth(setYear(viewMonth, y)); setPickMode("month"); }}
                        className={cn(
                          "h-12 rounded-2xl text-sm font-medium transition-all active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                            : "bg-secondary/60 text-foreground hover:bg-secondary"
                        )}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              {pickMode === "day" && (
                <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-border/40">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-[10px] text-muted-foreground">Запланировано</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-muted-foreground">Выполнено</span>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => { onChange(new Date()); setOpen(false); }}
                  className="flex-1 h-10 rounded-2xl bg-primary/10 text-primary font-semibold text-xs active:scale-95"
                >
                  Сегодня
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
