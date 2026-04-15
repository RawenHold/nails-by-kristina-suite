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

const views = ["Day", "Week"];

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

const statusConfig = {
  planned: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", dot: "bg-blue-500" },
  confirmed: { bg: "bg-success/10", text: "text-success", dot: "bg-success" },
  completed: { bg: "bg-muted", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  canceled: { bg: "bg-destructive/10", text: "text-destructive", dot: "bg-destructive" },
  no_show: { bg: "bg-warning/10", text: "text-warning", dot: "bg-warning" },
};

export default function CalendarPage() {
  const [view, setView] = useState("Day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const appointments = mockAppointments.today || [];

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Calendar"
        subtitle={format(currentDate, "EEEE, MMMM d")}
      />

      <div className="px-4 space-y-3 pb-4">
        {/* View Toggle */}
        <ChipGroup options={views} selected={view} onChange={setView} />

        {/* Week Strip */}
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 flex justify-between">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, currentDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setCurrentDate(day)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 w-9 py-1.5 rounded-xl transition-colors",
                    isSelected && "bg-primary",
                    !isSelected && isToday && "bg-primary/10"
                  )}
                >
                  <span className={cn("text-[10px] font-medium", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>
                    {format(day, "EEE")}
                  </span>
                  <span className={cn("text-sm font-semibold", isSelected ? "text-primary-foreground" : "text-foreground")}>
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Appointments */}
        {appointments.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No appointments"
            description="Your schedule is clear for this day"
          />
        ) : (
          <div className="space-y-2">
            {appointments.map((apt, i) => {
              const sc = statusConfig[apt.status];
              return (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <GlassCard className="py-3">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 pt-0.5">
                        <span className="text-sm font-semibold text-foreground">{apt.time}</span>
                        <div className="w-px h-4 bg-border" />
                        <span className="text-[10px] text-muted-foreground">{apt.endTime}</span>
                      </div>
                      <div className={cn("w-0.5 h-full min-h-[48px] rounded-full", sc.dot)} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{apt.client}</span>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", sc.bg, sc.text)}>
                            {apt.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {apt.services.map((s) => (
                            <span key={s} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                              {s}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs font-medium text-primary mt-1.5">
                          {formatCurrency(apt.price)} UZS
                        </p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}

            {/* Day Summary */}
            <GlassCard className="mt-2">
              <div className="flex justify-between text-center">
                <div>
                  <p className="text-lg font-semibold text-foreground">{appointments.length}</p>
                  <p className="text-[10px] text-muted-foreground">Appointments</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(appointments.reduce((sum, a) => sum + a.price, 0))}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Expected Revenue</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {Math.round(appointments.reduce((sum, a) => {
                      const [h1, m1] = a.time.split(":").map(Number);
                      const [h2, m2] = a.endTime.split(":").map(Number);
                      return sum + (h2 * 60 + m2) - (h1 * 60 + m1);
                    }, 0) / 60)}h
                  </p>
                  <p className="text-[10px] text-muted-foreground">Booked Time</p>
                </div>
              </div>
            </GlassCard>
          </div>
        )}
      </div>

      <FloatingActionButton onClick={() => toast.info("Add appointment coming soon")} />
    </div>
  );
}
