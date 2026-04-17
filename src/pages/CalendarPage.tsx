import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { CalendarDays, ChevronLeft, ChevronRight, X, Check, XCircle, Ban } from "lucide-react";
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ru } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAppointments, useCreateAppointment, useUpdateAppointmentStatus, useDeleteAppointment } from "@/hooks/useAppointments";
import { useClients } from "@/hooks/useClients";
import { useServices } from "@/hooks/useServices";

const statusColors: Record<string, string> = {
  planned: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  confirmed: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  completed: "bg-muted text-muted-foreground",
  canceled: "bg-destructive/10 text-destructive",
  no_show: "bg-warning/10 text-warning",
};
const statusDot: Record<string, string> = { planned: "bg-blue-500", confirmed: "bg-emerald-500", completed: "bg-muted-foreground", canceled: "bg-destructive", no_show: "bg-warning" };
const statusLabels: Record<string, string> = { planned: "План", confirmed: "Подтв.", completed: "Готово", canceled: "Отмена", no_show: "Неявка" };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ client_id: "", start_hour: "10", start_min: "00", end_hour: "11", end_min: "30", notes: "", selectedServices: [] as { id: string; price: number; name: string }[] });

  const { data: appointments, isLoading } = useAppointments(currentDate);
  const { data: clients } = useClients();
  const { data: services } = useServices();
  const createAppointment = useCreateAppointment();
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppointment = useDeleteAppointment();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  const expectedPrice = form.selectedServices.reduce((s, sv) => s + sv.price, 0);

  const handleCreate = async () => {
    const startTime = new Date(currentDate);
    startTime.setHours(parseInt(form.start_hour), parseInt(form.start_min), 0, 0);
    const endTime = new Date(currentDate);
    endTime.setHours(parseInt(form.end_hour), parseInt(form.end_min), 0, 0);

    if (endTime <= startTime) { toast.error("Время окончания должно быть позже начала"); return; }

    await createAppointment.mutateAsync({
      client_id: form.client_id || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      expected_price: expectedPrice,
      notes: form.notes || undefined,
      service_ids: form.selectedServices.map(s => ({ id: s.id, price: s.price })),
    });
    setShowForm(false);
    setForm({ client_id: "", start_hour: "10", start_min: "00", end_hour: "11", end_min: "30", notes: "", selectedServices: [] });
  };

  const toggleService = (svc: { id: string; default_price: number; name: string }) => {
    setForm(prev => {
      const exists = prev.selectedServices.find(s => s.id === svc.id);
      return { ...prev, selectedServices: exists ? prev.selectedServices.filter(s => s.id !== svc.id) : [...prev.selectedServices, { id: svc.id, price: svc.default_price, name: svc.name }] };
    });
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Календарь" subtitle={format(currentDate, "EEEE, d MMMM", { locale: ru })} />
      <div className="px-4 space-y-3 pb-4">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCurrentDate(d => addDays(d, -7))} className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1 flex justify-between gap-1">
            {weekDays.map((day) => {
              const isSelected = isSameDay(day, currentDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button key={day.toISOString()} onClick={() => setCurrentDate(day)}
                  className={cn("flex flex-col items-center gap-1 flex-1 py-2 rounded-2xl transition-all duration-200",
                    isSelected && "bg-primary shadow-sm shadow-primary/20", !isSelected && isToday && "bg-primary/8")}>
                  <span className={cn("text-[10px] font-medium", isSelected ? "text-primary-foreground" : "text-muted-foreground")}>{format(day, "EEE", { locale: ru })}</span>
                  <span className={cn("text-sm font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>{format(day, "d")}</span>
                  {isToday && !isSelected && <span className="w-1 h-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
          <button onClick={() => setCurrentDate(d => addDays(d, 7))} className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {appointments && appointments.length > 0 && (
          <GlassCard elevated className="py-3">
            <div className="flex justify-between text-center">
              <div><p className="text-lg font-bold text-foreground">{appointments.length}</p><p className="text-[10px] text-muted-foreground">Клиентов</p></div>
              <div><p className="text-lg font-bold text-foreground">{formatCurrency(appointments.reduce((s, a) => s + a.expected_price, 0))}</p><p className="text-[10px] text-muted-foreground">Ожидается</p></div>
            </div>
          </GlassCard>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl shimmer" />)}</div>
        ) : !appointments?.length ? (
          <EmptyState icon={CalendarDays} title="Нет записей" description="Расписание свободно" />
        ) : (
          <div className="space-y-2">
            {appointments.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard className="py-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[44px]">
                      <span className="text-sm font-bold text-foreground">{format(new Date(apt.start_time), "HH:mm")}</span>
                      <div className={cn("w-0.5 h-5 rounded-full", statusDot[apt.status])} />
                      <span className="text-[10px] text-muted-foreground">{format(new Date(apt.end_time), "HH:mm")}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">{apt.clients?.full_name || "—"}</span>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[apt.status])}>{statusLabels[apt.status]}</span>
                      </div>
                      {apt.appointment_services && apt.appointment_services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {apt.appointment_services.map((s) => <span key={s.id} className="text-[10px] bg-secondary/70 text-secondary-foreground px-2 py-0.5 rounded-full">{s.services?.name}</span>)}
                        </div>
                      )}
                      <p className="text-xs font-semibold text-primary">{formatCurrency(apt.expected_price)} сум</p>
                      {/* Status actions */}
                      {apt.status !== "completed" && apt.status !== "canceled" && (
                        <div className="flex gap-2 mt-2">
                          {apt.status === "planned" && (
                            <button onClick={() => updateStatus.mutate({ id: apt.id, status: "confirmed" })}
                              className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full active:scale-95">Подтвердить</button>
                          )}
                          <button onClick={() => setCompleteTarget(apt)}
                            className="text-[10px] font-semibold text-primary bg-primary/8 px-2.5 py-1 rounded-full active:scale-95 flex items-center gap-1"><Check className="w-3 h-3" />Завершить</button>
                          <button onClick={() => updateStatus.mutate({ id: apt.id, status: "canceled" })}
                            className="text-[10px] font-semibold text-destructive bg-destructive/8 px-2.5 py-1 rounded-full active:scale-95">Отмена</button>
                          <button onClick={() => updateStatus.mutate({ id: apt.id, status: "no_show" })}
                            className="text-[10px] font-semibold text-warning bg-warning/8 px-2.5 py-1 rounded-full active:scale-95">Неявка</button>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create appointment form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 max-h-[90vh] overflow-y-auto safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">Новая запись</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Клиентка</label>
                  <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">Выберите клиентку</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Начало</label>
                    <div className="flex gap-1">
                      <select value={form.start_hour} onChange={(e) => setForm({ ...form, start_hour: e.target.value })}
                        className="flex-1 h-11 px-2 rounded-2xl bg-secondary/70 text-foreground text-sm text-center focus:outline-none">
                        {Array.from({ length: 14 }, (_, i) => i + 8).map(h => <option key={h} value={h.toString().padStart(2, "0")}>{h.toString().padStart(2, "0")}</option>)}
                      </select>
                      <span className="self-center text-muted-foreground">:</span>
                      <select value={form.start_min} onChange={(e) => setForm({ ...form, start_min: e.target.value })}
                        className="flex-1 h-11 px-2 rounded-2xl bg-secondary/70 text-foreground text-sm text-center focus:outline-none">
                        {["00", "15", "30", "45"].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Конец</label>
                    <div className="flex gap-1">
                      <select value={form.end_hour} onChange={(e) => setForm({ ...form, end_hour: e.target.value })}
                        className="flex-1 h-11 px-2 rounded-2xl bg-secondary/70 text-foreground text-sm text-center focus:outline-none">
                        {Array.from({ length: 14 }, (_, i) => i + 8).map(h => <option key={h} value={h.toString().padStart(2, "0")}>{h.toString().padStart(2, "0")}</option>)}
                      </select>
                      <span className="self-center text-muted-foreground">:</span>
                      <select value={form.end_min} onChange={(e) => setForm({ ...form, end_min: e.target.value })}
                        className="flex-1 h-11 px-2 rounded-2xl bg-secondary/70 text-foreground text-sm text-center focus:outline-none">
                        {["00", "15", "30", "45"].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Услуги</label>
                  <div className="flex flex-wrap gap-2">
                    {services?.map(svc => {
                      const selected = form.selectedServices.some(s => s.id === svc.id);
                      return (
                        <button key={svc.id} onClick={() => toggleService(svc)}
                          className={cn("text-xs px-3 py-1.5 rounded-full transition-all", selected ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground")}>
                          {svc.name} · {formatCurrency(svc.default_price)}
                        </button>
                      );
                    })}
                  </div>
                  {services?.length === 0 && <p className="text-xs text-muted-foreground">Добавьте услуги в настройках</p>}
                </div>
                {expectedPrice > 0 && (
                  <div className="text-center p-3 rounded-2xl bg-primary/5">
                    <p className="text-xs text-muted-foreground">Ожидаемая стоимость</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(expectedPrice)} сум</p>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Заметки</label>
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Дополнительно..." />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={createAppointment.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createAppointment.isPending ? "Создание..." : "Создать запись"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!deleteId} onConfirm={() => { if (deleteId) deleteAppointment.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} title="Удалить запись?" description="Это действие нельзя отменить." />

      <FloatingActionButton onClick={() => setShowForm(true)} />
    </div>
  );
}
