import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import ChipGroup from "@/components/ui/ChipGroup";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Users,
  Bell,
  Plus,
  Clock,
  Wallet,
  UserPlus,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const periods = ["Today", "This Week", "This Month"];

export default function HomePage() {
  const [period, setPeriod] = useState("Today");
  const navigate = useNavigate();

  // Mock data for initial UI
  const stats = {
    revenue: "1,250,000",
    expenses: "320,000",
    profit: "930,000",
    appointments: 4,
    avgCheck: "312,500",
    repeatRate: "78%",
  };

  const quickActions = [
    { icon: UserPlus, label: "Client", action: () => navigate("/clients") },
    { icon: CalendarDays, label: "Appointment", action: () => navigate("/calendar") },
    { icon: DollarSign, label: "Income", action: () => navigate("/finances") },
    { icon: TrendingDown, label: "Expense", action: () => navigate("/finances") },
    { icon: Bell, label: "Reminder", action: () => toast.info("Coming soon") },
  ];

  const upcomingAppointments = [
    { time: "10:00", client: "Anna K.", service: "Gel Polish + Design", status: "confirmed" },
    { time: "12:30", client: "Maria S.", service: "Manicure + Gel Polish", status: "planned" },
    { time: "15:00", client: "Elena V.", service: "Removal + New Set", status: "confirmed" },
  ];

  const remindersDue = [
    { client: "Olga P.", days: 2, status: "today" },
    { client: "Natasha R.", days: -3, status: "overdue" },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader title="Nails by Kristina" subtitle="Good morning, Kristina ✨" />

      <div className="px-4 space-y-4 pb-4">
        {/* Period Selector */}
        <ChipGroup options={periods} selected={period} onChange={setPeriod} />

        {/* Revenue Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Revenue" value={`${stats.revenue} UZS`} icon={TrendingUp} trend={12} />
          <StatCard label="Expenses" value={`${stats.expenses} UZS`} icon={TrendingDown} trend={-5} />
          <StatCard label="Net Profit" value={`${stats.profit} UZS`} icon={Wallet} />
          <StatCard label="Avg Check" value={`${stats.avgCheck} UZS`} icon={DollarSign} trend={8} />
        </div>

        {/* Quick Actions */}
        <GlassCard>
          <p className="text-xs font-medium text-muted-foreground mb-3">Quick Actions</p>
          <div className="flex justify-between">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <a.icon className="w-4.5 h-4.5 text-primary" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Upcoming Appointments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Today</h2>
            <button onClick={() => navigate("/calendar")} className="text-xs text-primary font-medium flex items-center gap-0.5">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingAppointments.map((apt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{apt.client}</span>
                      <span className="text-xs font-semibold text-primary">{apt.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{apt.service}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Reminders Due */}
        {remindersDue.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-warning" /> Reminders
              </h2>
            </div>
            <div className="space-y-2">
              {remindersDue.map((r, i) => (
                <GlassCard key={i} className="flex items-center justify-between py-3">
                  <div>
                    <span className="text-sm font-medium text-foreground">{r.client}</span>
                    <p className="text-xs text-muted-foreground">
                      {r.status === "overdue"
                        ? `${Math.abs(r.days)} days overdue`
                        : `Due in ${r.days} days`}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      r.status === "overdue"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {r.status === "overdue" ? "Overdue" : "Today"}
                  </span>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <GlassCard>
          <p className="text-xs font-medium text-muted-foreground mb-2">This Month</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{stats.appointments}</p>
              <p className="text-[10px] text-muted-foreground">Appointments</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{stats.repeatRate}</p>
              <p className="text-[10px] text-muted-foreground">Repeat Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">12</p>
              <p className="text-[10px] text-muted-foreground">Clients</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
