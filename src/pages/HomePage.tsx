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
  Clock,
  Wallet,
  UserPlus,
  DollarSign,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Repeat,
  Heart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const periods = ["Today", "This Week", "This Month"];

export default function HomePage() {
  const [period, setPeriod] = useState("Today");
  const navigate = useNavigate();

  const stats = {
    revenue: "1,250,000",
    expenses: "320,000",
    profit: "930,000",
    appointments: 4,
    avgCheck: "312,500",
    repeatRate: "78%",
  };

  const quickActions = [
    { icon: UserPlus, label: "Client", color: "bg-primary/10", action: () => navigate("/clients") },
    { icon: CalendarDays, label: "Book", color: "bg-blue-50 dark:bg-blue-900/20", action: () => navigate("/calendar") },
    { icon: DollarSign, label: "Income", color: "bg-emerald-50 dark:bg-emerald-900/20", action: () => navigate("/finances") },
    { icon: TrendingDown, label: "Expense", color: "bg-amber-50 dark:bg-amber-900/20", action: () => navigate("/finances") },
    { icon: Bell, label: "Remind", color: "bg-purple-50 dark:bg-purple-900/20", action: () => toast.info("Coming soon") },
  ];

  const overdueReminders = [
    { client: "Natasha R.", days: 3, phone: "+998 95 567 8901" },
    { client: "Olga P.", days: 1, phone: "+998 94 456 7890" },
  ];

  const todayReminders = [
    { client: "Elena V.", days: 0, phone: "+998 93 345 6789" },
  ];

  const upcomingAppointments = [
    { time: "10:00", client: "Anna K.", service: "Gel Polish + Design", status: "confirmed" as const, price: 350000 },
    { time: "12:30", client: "Maria S.", service: "Manicure + Gel", status: "planned" as const, price: 280000 },
    { time: "15:00", client: "Elena V.", service: "Removal + New Set", status: "confirmed" as const, price: 450000 },
  ];

  const topClients = [
    { name: "Anna K.", visits: 24, spent: 7200000, trend: "up" },
    { name: "Maria S.", visits: 15, spent: 4500000, trend: "up" },
    { name: "Elena V.", visits: 8, spent: 2400000, trend: "stable" },
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  return (
    <div className="min-h-screen">
      <PageHeader title="Nails by Kristina" subtitle="Good morning, Kristina ✨" />

      <div className="px-4 space-y-4 pb-4">
        {/* Period */}
        <ChipGroup options={periods} selected={period} onChange={setPeriod} />

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Revenue" value={`${stats.revenue}`} icon={TrendingUp} trend={12} iconBg="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatCard label="Expenses" value={`${stats.expenses}`} icon={TrendingDown} trend={-5} iconBg="bg-red-50 dark:bg-red-900/20" />
          <StatCard label="Net Profit" value={`${stats.profit}`} icon={Wallet} iconBg="bg-primary/10" />
          <StatCard label="Avg Check" value={`${stats.avgCheck}`} icon={DollarSign} trend={8} iconBg="bg-amber-50 dark:bg-amber-900/20" />
        </div>

        {/* Quick Actions */}
        <GlassCard elevated>
          <div className="flex justify-between">
            {quickActions.map((a) => (
              <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", a.color)}>
                  <a.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Overdue Reminders — highest priority */}
        {overdueReminders.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground">Overdue Reminders</h2>
              <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{overdueReminders.length}</span>
            </div>
            <div className="space-y-1.5">
              {overdueReminders.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">{r.client}</span>
                        <p className="text-[10px] text-destructive font-medium">{r.days} days overdue</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.info("Message template coming soon")}
                      className="text-[11px] font-semibold text-primary bg-primary/8 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                    >
                      Remind
                    </button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Reminders */}
        {todayReminders.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Bell className="w-3.5 h-3.5 text-warning" />
              <h2 className="text-sm font-semibold text-foreground">Due Today</h2>
            </div>
            {todayReminders.map((r, i) => (
              <GlassCard key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{r.client}</span>
                    <p className="text-[10px] text-warning font-medium">Due today</p>
                  </div>
                </div>
                <button
                  onClick={() => toast.info("Message template coming soon")}
                  className="text-[11px] font-semibold text-primary bg-primary/8 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                >
                  Remind
                </button>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Upcoming Appointments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Today's Schedule</h2>
            <button onClick={() => navigate("/calendar")} className="text-[11px] text-primary font-semibold flex items-center gap-0.5 active:opacity-70">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {upcomingAppointments.map((apt, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="flex items-center gap-3 py-3">
                  <div className="flex flex-col items-center min-w-[44px]">
                    <span className="text-sm font-bold text-foreground">{apt.time}</span>
                    <span className={cn(
                      "text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5",
                      apt.status === "confirmed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    )}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="w-px h-10 bg-border/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{apt.client}</span>
                    <p className="text-[11px] text-muted-foreground truncate">{apt.service}</p>
                  </div>
                  <span className="text-xs font-semibold text-foreground/70 shrink-0">{formatCurrency(apt.price)}</span>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Repeat Client Insights */}
        <GlassCard elevated>
          <div className="flex items-center gap-1.5 mb-3">
            <Repeat className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Repeat Client Insights</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.repeatRate}</p>
              <p className="text-[10px] text-muted-foreground">Return Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.appointments}</p>
              <p className="text-[10px] text-muted-foreground">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">12</p>
              <p className="text-[10px] text-muted-foreground">Active Clients</p>
            </div>
          </div>
          <div className="space-y-2">
            {topClients.map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-primary">{c.name.split(" ").map(n => n[0]).join("")}</span>
                  </div>
                  <span className="text-xs font-medium text-foreground">{c.name}</span>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{formatCurrency(c.spent)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
