import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, setMonth, setYear } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthYearPickerProps {
  value: Date;
  onChange: (d: Date) => void;
}

const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];

export default function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const [open, setOpen] = useState(false);
  const [yearCursor, setYearCursor] = useState(value.getFullYear());

  const selectMonth = (m: number) => {
    const next = setYear(setMonth(value, m), yearCursor);
    onChange(next);
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(value);
    d.setMonth(d.getMonth() + delta);
    onChange(d);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => shiftMonth(-1)}
          className="w-9 h-9 rounded-2xl glass-button flex items-center justify-center active:scale-90"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={() => { setYearCursor(value.getFullYear()); setOpen(true); }}
          className="flex-1 h-9 px-4 rounded-2xl glass-button flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground capitalize">
            {format(value, "LLLL yyyy", { locale: ru })}
          </span>
        </button>
        <button
          onClick={() => shiftMonth(1)}
          className="w-9 h-9 rounded-2xl glass-button flex items-center justify-center active:scale-90"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm glass-card-elevated rounded-3xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setYearCursor(y => y - 1)}
                  className="w-9 h-9 rounded-xl glass-button flex items-center justify-center active:scale-90"
                  aria-label="Предыдущий год"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-base font-display font-semibold text-foreground">{yearCursor}</span>
                <button
                  onClick={() => setYearCursor(y => y + 1)}
                  className="w-9 h-9 rounded-xl glass-button flex items-center justify-center active:scale-90"
                  aria-label="Следующий год"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {months.map((m, i) => {
                  const isSelected = value.getMonth() === i && value.getFullYear() === yearCursor;
                  return (
                    <button
                      key={m}
                      onClick={() => selectMonth(i)}
                      className={cn(
                        "h-11 rounded-2xl text-xs font-medium transition-all active:scale-95",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                          : "bg-secondary/60 text-foreground hover:bg-secondary"
                      )}
                    >
                      {m.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
