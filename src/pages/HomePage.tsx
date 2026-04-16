import { useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CalendarDays, Users, Bell, Wallet, UserPlus, DollarSign, ArrowRight, AlertCircle, Repeat, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useCreateReminder } from "@/hooks/useReminders";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const periods = ["Сегодня", "Неделя", "Месяц"];
const periodMap: Record<string, string> = { "Сегодня": "today", "Неделя": "week", "Месяц": "month" };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 17) return "Добрый день";
  if (h >= 17 && h < 22) return "Добрый вечер";
  return "Доброй ночи";
}

export default function HomePage() {
  const [period, setPeriod] = useState("Месяц");
  const navigate = useNavigate();
  const { data: stats, isLoading } = useDashboardStats(periodMap[period]);
  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  const overdueReminders = useMemo(() => (stats?.reminders || []).filter(r => r.status === "overdue"), [stats]);
  const todayReminders = useMemo(() => (stats?.reminders || []).filter(r => r.status === "today"), [stats]);

  const quickActions = [
    { icon: UserPlus, label: "Клиент", color: "bg-primary/10", action: () => navigate("/clients") },
    { icon: CalendarDays, label: "Запись", color: "bg-blue-50 dark:bg-blue-900/20", action: () => navigate("/calendar") },
    { icon: DollarSign, label: "Доход", color: "bg-emerald-50 dark:bg-emerald-900/20", action: () => navigate("/finances") },
    { icon: TrendingDown, label: "Расход", color: "bg-amber-50 dark:bg-amber-900/20", action: () => navigate("/finances") },
    { icon: Settings, label: "Ещё", color: "bg-purple-50 dark:bg-purple-900/20", action: () => navigate("/settings") },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader title="Nails by Kristina" subtitle={`${getGreeting()}, Кристина ✨`} />
      <div className="px-4 space-y-4 pb-4">
        <ChipGroup options={periods} selected={period} onChange={setPeriod} />

        <div className="grid grid-cols-2 gap-2.5">
          <StatCard label="Доходы" value={formatCurrency(stats?.totalIncome || 0)} icon={TrendingUp} iconBg="bg-emerald-50 dark:bg-emerald-900/20" />
          <StatCard label="Расходы" value={formatCurrency(stats?.totalExpenses || 0)} icon={TrendingDown} iconBg="bg-red-50 dark:bg-red-900/20" />
          <StatCard label="Прибыль" value={formatCurrency(stats?.profit || 0)} icon={Wallet} iconBg="bg-primary/10" />
          <StatCard label="Ср. чек" value={formatCurrency(stats?.avgCheck || 0)} icon={DollarSign} iconBg="bg-amber-50 dark:bg-amber-900/20" />
        </div>

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

        {overdueReminders.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground">Просроченные</h2>
              <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{overdueReminders.length}</span>
            </div>
            <div className="space-y-1.5">
              {overdueReminders.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                        <Bell className="w-4 h-4 text-destructive" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground">{r.clients?.full_name}</span>
                        <p className="text-[10px] text-destructive font-medium">Просрочено</p>
                      </div>
                    </div>
                    <button onClick={() => navigate(`/clients/${r.client_id}`)}
                      className="text-[11px] font-semibold text-primary bg-primary/8 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                      Открыть
                    </button>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {todayReminders.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Bell className="w-3.5 h-3.5 text-warning" />
              <h2 className="text-sm font-semibold text-foreground">На сегодня</h2>
            </div>
            {todayReminders.map((r) => (
              <GlassCard key={r.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center"><Bell className="w-4 h-4 text-warning" /></div>
                  <div>
                    <span className="text-sm font-medium text-foreground">{r.clients?.full_name}</span>
                    <p className="text-[10px] text-warning font-medium">Сегодня</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/clients/${r.client_id}`)}
                  className="text-[11px] font-semibold text-primary bg-primary/8 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                  Открыть
                </button>
              </GlassCard>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Расписание на сегодня</h2>
            <button onClick={() => navigate("/calendar")} className="text-[11px] text-primary font-semibold flex items-center gap-0.5 active:opacity-70">
              Все <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {(stats?.appointmentsToday?.length || 0) === 0 ? (
            <EmptyState icon={CalendarDays} title="Нет записей" description="На сегодня расписание свободно" />
          ) : (
            <div className="space-y-1.5">
              {stats!.appointmentsToday.map((apt: any, i: number) => (
                <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="flex items-center gap-3 py-3">
                    <div className="flex flex-col items-center min-w-[44px]">
                      <span className="text-sm font-bold text-foreground">{format(new Date(apt.start_time), "HH:mm")}</span>
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5",
                        apt.status === "confirmed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      )}>{apt.status === "confirmed" ? "подтв." : "план"}</span>
                    </div>
                    <div className="w-px h-10 bg-border/60 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{apt.clients?.full_name || "—"}</span>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(apt.expected_price)} сум</p>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <GlassCard elevated>
          <div className="flex items-center gap-1.5 mb-3">
            <Repeat className="w-3.5 h-3.5 text-primary" />
            <p className="text-xs font-semibold text-foreground">Клиентская база</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats?.activeClients || 0}</p>
              <p className="text-[10px] text-muted-foreground">Активные</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats?.topClients?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground">Всего</p>
            </div>
          </div>
          {(stats?.topClients || []).length > 0 && (
            <div className="space-y-2">
              {stats!.topClients.slice(0, 3).map((c: any, i: number) => (
                <div key={c.id} className="flex items-center justify-between cursor-pointer active:opacity-70" onClick={() => navigate(`/clients/${c.id}`)}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-primary">{c.full_name?.split(" ").map((n: string) => n[0]).join("")}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{c.full_name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-muted-foreground">{formatCurrency(c.total_spent)} сум</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
