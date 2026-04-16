import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";
import RetentionBadge from "@/components/ui/RetentionBadge";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, MessageCircle, CalendarDays, Bell, Clock, Palette, Sparkles, Copy, ArrowRight, Image, X, Edit, Archive } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useVisits } from "@/hooks/useVisits";
import { usePhotos } from "@/hooks/usePhotos";
import { useCreateReminder } from "@/hooks/useReminders";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const tabs = ["Обзор", "История", "Галерея"];

export default function ClientProfilePage() {
  const { id } = useParams();
  const [tab, setTab] = useState("Обзор");
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const navigate = useNavigate();

  const { data: client, isLoading } = useClient(id);
  const { data: visits } = useVisits(id);
  const { data: photos } = usePhotos({ clientId: id });
  const createReminder = useCreateReminder();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  if (isLoading) return <div className="min-h-screen"><PageHeader title="Загрузка..." showBack /><div className="px-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}</div></div>;
  if (!client) return <div className="min-h-screen"><PageHeader title="Не найдена" showBack /><EmptyState icon={Sparkles} title="Клиентка не найдена" description="" /></div>;

  const c = client;

  const handleCreateReminder = async () => {
    if (!reminderDate) { toast.error("Выберите дату"); return; }
    await createReminder.mutateAsync({ client_id: c.id, reminder_date: reminderDate, notes: reminderNote || null });
    setShowReminder(false);
    setReminderDate("");
    setReminderNote("");
  };

  return (
    <div className="min-h-screen">
      <PageHeader title={c.full_name} showBack />
      <div className="px-4 space-y-4 pb-6">
        <GlassCard elevated className="text-center pt-6 pb-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-primary">{c.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">{c.full_name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <LoyaltyBadge level={c.loyalty_level} />
            <RetentionBadge status={c.lifecycle_status} />
          </div>
          <div className="flex justify-center gap-3 mt-4">
            {[
              { icon: Phone, label: "Звонок", action: () => { if (c.phone) { navigator.clipboard.writeText(c.phone); toast.success("Телефон скопирован"); } } },
              { icon: MessageCircle, label: "Telegram", action: () => { if (c.telegram_username) window.open(`https://t.me/${c.telegram_username.replace("@", "")}`, "_blank"); else toast.error("Telegram не указан"); } },
              { icon: CalendarDays, label: "Запись", action: () => navigate("/calendar") },
              { icon: Bell, label: "Напомнить", action: () => setShowReminder(true) },
              { icon: Archive, label: "Архив", action: () => setShowArchive(true) },
            ].map(a => (
              <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <div className="w-10 h-10 rounded-2xl bg-secondary/70 flex items-center justify-center"><a.icon className="w-4 h-4 text-foreground/70" /></div>
                <span className="text-[10px] font-medium text-muted-foreground">{a.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Визиты", value: c.total_visits.toString() },
            { label: "Расходы", value: `${(c.total_spent / 1000000).toFixed(1)}M` },
            { label: "Ср. чек", value: `${(c.average_check / 1000).toFixed(0)}K` },
            { label: "Дней", value: (c.days_since_last_visit ?? "—").toString() },
          ].map(s => (
            <GlassCard key={s.label} className="text-center py-3 px-2">
              <p className="text-base font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </GlassCard>
          ))}
        </div>

        {c.recommended_next_visit && (
          <GlassCard className="flex items-center gap-3 py-3 border-l-[3px] border-l-primary">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Рекомендуемый визит</p>
              <p className="text-[11px] text-muted-foreground">{c.recommended_next_visit}</p>
            </div>
            <button onClick={() => navigate("/calendar")} className="text-[11px] font-semibold text-primary active:opacity-70">Записать</button>
          </GlassCard>
        )}

        <ChipGroup options={tabs} selected={tab} onChange={setTab} />

        {tab === "Обзор" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <GlassCard>
              <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> Предпочтения</p>
              <div className="space-y-2.5">
                {c.favorite_colors && c.favorite_colors.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Любимые цвета</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.favorite_colors.map(color => <span key={color} className="text-[11px] font-medium bg-primary/8 text-primary px-2.5 py-1 rounded-full">{color}</span>)}
                    </div>
                  </div>
                )}
                <div className="flex gap-6">
                  {c.favorite_shape && <div><p className="text-[10px] text-muted-foreground mb-0.5">Форма</p><p className="text-sm font-medium text-foreground">{c.favorite_shape}</p></div>}
                  {c.favorite_length && <div><p className="text-[10px] text-muted-foreground mb-0.5">Длина</p><p className="text-sm font-medium text-foreground">{c.favorite_length}</p></div>}
                </div>
                {c.favorite_designs && c.favorite_designs.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Дизайны</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.favorite_designs.map(d => <span key={d} className="text-[11px] font-medium bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{d}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
            {(c.notes || c.allergies) && (
              <GlassCard>
                {c.allergies && (
                  <div className="flex items-start gap-2 mb-2 p-2 rounded-xl bg-destructive/5">
                    <span className="text-[10px] font-bold text-destructive">⚠️</span>
                    <p className="text-xs text-destructive">{c.allergies}</p>
                  </div>
                )}
                {c.notes && <p className="text-xs text-muted-foreground leading-relaxed">{c.notes}</p>}
              </GlassCard>
            )}
            <GlassCard>
              <p className="text-xs font-semibold text-foreground mb-2">Контакты</p>
              <div className="space-y-2">
                {c.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{c.phone}</span>
                    <button onClick={() => { navigator.clipboard.writeText(c.phone!); toast.success("Скопировано"); }}><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                )}
                {c.telegram_username && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{c.telegram_username}</span>
                    <button onClick={() => { navigator.clipboard.writeText(c.telegram_username!); toast.success("Скопировано"); }}><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {tab === "История" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {!visits?.length ? <EmptyState icon={CalendarDays} title="Нет визитов" description="История появится после первого визита" /> :
              visits.map((visit) => (
                <GlassCard key={visit.id} className="py-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{format(new Date(visit.visit_date), "d MMMM yyyy", { locale: ru })}</p>
                      {visit.services_performed && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {visit.services_performed.map((s: string) => <span key={s} className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{s}</span>)}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground">{formatCurrency(visit.total_price)} сум</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    {visit.colors_used && <span className="flex items-center gap-1"><Palette className="w-3 h-3" /> {visit.colors_used.join(", ")}</span>}
                    {visit.nail_shape && <span>• {visit.nail_shape}</span>}
                  </div>
                </GlassCard>
              ))
            }
          </motion.div>
        )}

        {tab === "Галерея" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!photos?.length ? <EmptyState icon={Image} title="Нет фото" description="Фотографии появятся после загрузки" /> : (
              <div className="grid grid-cols-3 gap-1.5">
                {photos.map(p => (
                  <div key={p.id} className="aspect-square rounded-xl overflow-hidden">
                    <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Reminder bottom sheet */}
      <AnimatePresence>
        {showReminder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowReminder(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">Напоминание</h2>
                <button onClick={() => setShowReminder(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Дата</label>
                  <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Заметка</label>
                  <input value={reminderNote} onChange={(e) => setReminderNote(e.target.value)}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Записать на маникюр..." />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateReminder} disabled={createReminder.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createReminder.isPending ? "Сохранение..." : "Создать напоминание"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={showArchive} onConfirm={() => { deleteClient.mutate(c.id); navigate("/clients"); }} onCancel={() => setShowArchive(false)}
        title="Архивировать?" description="Клиентка будет перемещена в архив" />
    </div>
  );
}
