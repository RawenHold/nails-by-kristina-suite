import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import EmptyState from "@/components/ui/EmptyState";
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  time: string;
  endTime: string;
  client: string;
  services: string[];
  status: "planned" | "confirmed" | "completed" | "canceled" | "no_show";
  price: number;
}

const mockAppointments: Record<string, Appointment[]> = {
  today: [
    { id: "1", time: "10:00", endTime: "11:30", client: "Anna K.", services: ["Gel Polish", "Design"], status: "confirmed", price: 350000 },
    { id: "2", time: "12:30", endTime: "14:00", client: "Maria S.", services: ["Manicure", "Gel Polish"], status: "planned", price: 280000 },
    { id: "3", time: "15:00", endTime: "17:00", client: "Elena V.", services: ["Removal", "New Set", "Design"], status: "confirmed", price: 450000 },
  ],
};

const statusColors = {
  planned: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  confirmed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  canceled: "bg-destructive/10 text-destructive",
  no_show: "bg-warning/10 text-warning",
};

const statusDot = {
  planned: "bg-blue-500",
  confirmed: "bg-emerald-500",
  completed: "bg-muted-foreground",
  canceled: "bg-destructive",
  no_show: "bg-warning",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const appointments = mockAppointments.today || [];
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  return (
    <div className="min-h-screen">
      <PageHeader title="Calendar" subtitle={format(currentDate, "EEEE, MMMM d")} />

      <div className="px-4 space-y-3 pb-4">
        {/* Week Strip */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 flex justify-between gap-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, currentDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCurrentDate(day)}
                  className={cn(
                    "flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all duration-200",
                    isSelected && "bg-primary shadow-sm shadow-primary/20",
                    !isSelected && isToday && "bg-primary/8"
                  )}
                >
                  <span className={cn("text-[10px] font-medium", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                    {format(day, "EEE")}
                  </span>
                  <span className={cn("text-sm font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                    {format(day, "d")}
                  </span>
                  {isToday && !isSelected && <span className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Day Summary */}
        {appointments.length > 0 && (
          <GlassCard elevated className="py-3">
            <div className="flex justify-between text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{appointments.length}</p>
                <p className="text-[10px] text-muted-foreground">Clients</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(appointments.reduce((s, a) => s + a.price, 0))}
                </p>
                <p className="text-[10px] text-muted-foreground">Expected</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(appointments.reduce((s, a) => {
                    const [h1, m1] = a.time.split(":").map(Number);
                    const [h2, m2] = a.endTime.split(":").map(Number);
                    return s + (h2 * 60 + m2) - (h1 * 60 + m1);
                  }, 0) / 60)}h
                </p>
                <p className="text-[10px] text-muted-foreground">Booked</p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Appointments */}
        {appointments.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No appointments" description="Your schedule is clear for this day" />
        ) : (
          <div className="space-y-2">
            {appointments.map((apt, i) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[44px]">
                      <span className="text-sm font-bold text-foreground">{apt.time}</span>
                      <div className={cn("w-0.5 h-5 rounded-full", statusDot[apt.status])} />
                      <span className="text-[10px] text-muted-foreground">{apt.endTime}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">{apt.client}</span>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[apt.status])}>
                          {apt.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {apt.services.map((s) => (
                          <span key={s} className="text-[10px] bg-secondary/70 text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                      <p className="text-xs font-semibold text-primary">{formatCurrency(apt.price)} UZS</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <FloatingActionButton onClick={() => toast.info("Add appointment coming soon")} />
    </div>
  );
}
