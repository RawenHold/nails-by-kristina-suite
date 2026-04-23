import { useState, useMemo, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CalendarDays, Bell, Wallet, UserPlus, DollarSign, ArrowRight, Repeat, Check, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn, formatMoney } from "@/lib/utils";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useUpdateReminderStatus } from "@/hooks/useReminders";
import { format, differenceInCalendarDays, parseISO, isToday, isTomorrow, isThisWeek } from "date-fns";
import { ru } from "date-fns/locale";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";

const periods = ["Сегодня", "Неделя", "Месяц"];
const periodMap: Record<string, string> = { "Сегодня": "today", "Неделя": "week", "Месяц": "month" };

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Доброе утро";
  if (h >= 12 && h < 17) return "Добрый день";
  if (h >= 17 && h < 22) return "Добрый вечер";
  return "Доброй ночи";
}

function reminderTimeLabel(dateStr: string, status: string) {
  if (status === "today") return "Сегодня";
  const days = differenceInCalendarDays(parseISO(dateStr), new Date());
  if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`;
  if (days === 1) return "Завтра";
  if (days <= 7) return `Через ${days} дн.`;
  return format(parseISO(dateStr), "d MMM", { locale: ru });
}

export default function HomePage() {
  const [period, setPeriod] = useState("Месяц");
  const [greeting, setGreeting] = useState(getGreeting());
  const navigate = useNavigate();
  const { data: stats } = useDashboardStats(periodMap[period]);
  const markSent = useUpdateReminderStatus();
  const formatCurrency = formatMoney;

  useEffect(() => {
    const t = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(t);
  }, []);

  const overdueReminders = useMemo(() => (stats?.reminders || []).filter(r => r.computed_status === "overdue"), [stats]);
  const todayReminders = useMemo(() => (stats?.reminders || []).filter(r => r.computed_status === "today"), [stats]);
  const upcomingReminders = useMemo(() => (stats?.reminders || []).filter(r => r.computed_status === "upcoming").slice(0, 3), [stats]);

  const quickActions = [
    { icon: UserPlus, label: "Клиент", color: "bg-primary/10", action: () => navigate("/clients") },
    { icon: CalendarDays, label: "Запись", color: "bg-blue-50 dark:bg-blue-900/20", action: () => navigate("/calendar") },
    { icon: DollarSign, label: "Доход", color: "bg-emerald-50 dark:bg-emerald-900/20", action: () => navigate("/finances") },
    { icon: TrendingDown, label: "Расход", color: "bg-amber-50 dark:bg-amber-900/20", action: () => navigate("/finances") },
  ];

  return (
    <div className="min-h-screen">
      <PageHeader title="K Nails Finance" subtitle={`${greeting} ✨`} scene showMenu />
      <div className="px-4 space-y-4 pt-2 pb-nav">
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
              <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform min-w-[44px]">
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", a.color)}>
                  <a.icon className="w-5 h-5 text-foreground/70" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {(overdueReminders.length > 0 || todayReminders.length > 0 || upcomingReminders.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Напоминания</h2>
              </div>
              {overdueReminders.length > 0 && (
                <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  {overdueReminders.length} просрочено
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {[...overdueReminders, ...todayReminders, ...upcomingReminders].map((r, i) => {
                const isOverdue = r.computed_status === "overdue";
                const isToday = r.computed_status === "today";
                const accent = isOverdue ? "destructive" : isToday ? "warning" : "primary";
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlassCard className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          isOverdue && "bg-destructive/10",
                          isToday && "bg-warning/10",
                          !isOverdue && !isToday && "bg-primary/10",
                        )}>
                          <Bell className={cn("w-4 h-4",
                            isOverdue && "text-destructive",
                            isToday && "text-warning",
                            !isOverdue && !isToday && "text-primary",
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{r.clients?.full_name}</p>
                          <p className={cn("text-[10px] font-medium",
                            isOverdue && "text-destructive",
                            isToday && "text-warning",
                            !isOverdue && !isToday && "text-muted-foreground",
                          )}>
                            {reminderTimeLabel(r.reminder_date, r.computed_status!)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => markSent.mutate({ id: r.id, status: "sent" })}
                          className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center active:scale-90"
                          aria-label="Выполнено"
                        >
                          <Check className="w-3.5 h-3.5 text-success" />
                        </button>
                        <button
                          onClick={() => navigate(`/clients/${r.client_id}`)}
                          className="text-[11px] font-semibold text-primary bg-primary/8 px-3 py-1.5 rounded-full active:scale-95"
                        >
                          Открыть
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">Предстоящие записи</h2>
            <button onClick={() => navigate("/calendar")} className="text-[11px] text-primary font-semibold flex items-center gap-0.5 active:opacity-70">
              Все <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {(stats?.upcomingAppointments?.length || 0) === 0 ? (
            <EmptyState icon={CalendarDays} title="Нет записей" description="На ближайшие 30 дней расписание свободно" />
          ) : (
            <div className="space-y-1.5">
              {stats!.upcomingAppointments.map((apt: any, i: number) => {
                const d = new Date(apt.start_time);
                const dayLabel = isToday(d)
                  ? "Сегодня"
                  : isTomorrow(d)
                    ? "Завтра"
                    : isThisWeek(d, { weekStartsOn: 1 })
                      ? format(d, "EEEE", { locale: ru })
                      : format(d, "d MMM", { locale: ru });
                return (
                  <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <GlassCard className="flex items-center gap-3 py-3 cursor-pointer" onClick={() => navigate("/calendar", { state: { date: apt.start_time } })}>
                      <div className="flex flex-col items-center min-w-[56px]">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{dayLabel}</span>
                        <span className="text-sm font-bold text-foreground mt-0.5">{format(d, "HH:mm")}</span>
                        <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5",
                          apt.status === "completed" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : apt.status === "confirmed" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          : "bg-secondary text-muted-foreground"
                        )}>
                          {apt.status === "completed" ? "готово" : apt.status === "confirmed" ? "подтв." : "план"}
                        </span>
                      </div>
                      <div className="w-px h-12 bg-border/60 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-foreground truncate">{apt.clients?.full_name || "—"}</span>
                          {apt.clients?.loyalty_level && <LoyaltyBadge level={apt.clients.loyalty_level} showLabel={false} />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {format(d, "d MMMM, EEEE", { locale: ru })} · {formatCurrency(apt.expected_price)} сум
                        </p>
                      </div>
                      <Clock className="w-4 h-4 text-muted-foreground/40" />
                    </GlassCard>
                  </motion.div>
                );
              })}
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
              <p className="text-lg font-bold text-foreground">{stats?.totalClients || 0}</p>
              <p className="text-[10px] text-muted-foreground">Всего</p>
            </div>
          </div>
          {(stats?.topClients || []).length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Топ клиентов</p>
              {stats!.topClients.slice(0, 5).map((c: any, i: number) => {
                const isRegular = (c.total_visits ?? 0) >= 3;
                const rankColors = ["text-amber-500", "text-slate-400", "text-amber-700", "text-muted-foreground", "text-muted-foreground"];
                return (
                  <div key={c.id} className="flex items-center justify-between cursor-pointer active:opacity-70" onClick={() => navigate(`/clients/${c.id}`)}>
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={cn("text-[11px] font-bold w-4 text-center", rankColors[i])}>{i + 1}</span>
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-primary">{c.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium text-foreground truncate">{c.full_name}</span>
                          {c.loyalty_level && <LoyaltyBadge level={c.loyalty_level} showLabel={false} />}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {c.total_visits ?? 0} {(c.total_visits ?? 0) === 1 ? "визит" : "визитов"} ·{" "}
                          <span className={isRegular ? "text-success font-semibold" : "text-muted-foreground"}>
                            {isRegular ? "постоянная" : "разовая"}
                          </span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-foreground shrink-0 ml-2">{formatCurrency(c.total_spent)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
