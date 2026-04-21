import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";
import RetentionBadge from "@/components/ui/RetentionBadge";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import BottomSheet from "@/components/ui/BottomSheet";
import { motion } from "framer-motion";
import { Phone, MessageCircle, CalendarDays, Bell, Clock, Palette, Sparkles, Copy, Image as ImageIcon, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn, formatMoney } from "@/lib/utils";
import { useClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useVisits } from "@/hooks/useVisits";
import { usePhotos } from "@/hooks/usePhotos";
import { useCreateReminder } from "@/hooks/useReminders";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const tabs = ["Обзор", "История", "Галерея"];
const shapes = ["Миндаль", "Квадрат", "Овал", "Балерина", "Стилет"];
const lengths = ["Короткие", "Средние", "Длинные"];
const lifecycles: { value: "new" | "active" | "inactive" | "lost" | "vip"; label: string }[] = [
  { value: "new", label: "Новая" },
  { value: "active", label: "Активная" },
  { value: "inactive", label: "Неактивная" },
  { value: "lost", label: "Потерянная" },
  { value: "vip", label: "VIP" },
];
const loyalties: { value: "bronze" | "silver" | "gold" | "vip"; label: string }[] = [
  { value: "bronze", label: "Бронза" },
  { value: "silver", label: "Серебро" },
  { value: "gold", label: "Золото" },
  { value: "vip", label: "VIP" },
];

type VisitItem = ReturnType<typeof useVisits>["data"] extends (infer U)[] | undefined ? U : never;

export default function ClientProfilePage() {
  const { id } = useParams();
  const [tab, setTab] = useState("Обзор");
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderNote, setReminderNote] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [visitDetails, setVisitDetails] = useState<VisitItem | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    telegram_username: "",
    notes: "",
    favorite_shape: "",
    favorite_length: "",
    allergies: "",
    favorite_colors: "",
    favorite_designs: "",
    manual_reminder_date: "",
    lifecycle_status: "active" as "new" | "active" | "inactive" | "lost" | "vip",
    loyalty_level: "bronze" as "bronze" | "silver" | "gold" | "vip",
  });
  const navigate = useNavigate();

  const { data: client, isLoading } = useClient(id);
  const { data: visits } = useVisits(id);
  const { data: photos } = usePhotos({ clientId: id });
  const createReminder = useCreateReminder();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const formatCurrency = formatMoney;

  useEffect(() => {
    if (client && showEdit) {
      setEditForm({
        full_name: client.full_name,
        phone: client.phone || "",
        telegram_username: client.telegram_username || "",
        notes: client.notes || "",
        favorite_shape: client.favorite_shape || "",
        favorite_length: client.favorite_length || "",
        allergies: client.allergies || "",
        favorite_colors: (client.favorite_colors || []).join(", "),
        favorite_designs: (client.favorite_designs || []).join(", "),
        manual_reminder_date: client.manual_reminder_date || "",
        lifecycle_status: client.lifecycle_status,
        loyalty_level: client.loyalty_level,
      });
    }
  }, [client, showEdit]);

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

  const handleSaveEdit = async () => {
    if (!editForm.full_name.trim()) { toast.error("Имя обязательно"); return; }
    await updateClient.mutateAsync({
      id: c.id,
      full_name: editForm.full_name.trim(),
      phone: editForm.phone || null,
      telegram_username: editForm.telegram_username || null,
      notes: editForm.notes || null,
      favorite_shape: editForm.favorite_shape || null,
      favorite_length: editForm.favorite_length || null,
      allergies: editForm.allergies || null,
      favorite_colors: editForm.favorite_colors ? editForm.favorite_colors.split(",").map(s => s.trim()).filter(Boolean) : null,
      favorite_designs: editForm.favorite_designs ? editForm.favorite_designs.split(",").map(s => s.trim()).filter(Boolean) : null,
      manual_reminder_date: editForm.manual_reminder_date || null,
      lifecycle_status: editForm.lifecycle_status,
      loyalty_level: editForm.loyalty_level,
    });
    setShowEdit(false);
  };

  return (
    <div className="min-h-screen">
      <PageHeader title={c.full_name} showBack />
      <div className="px-4 space-y-4 pb-nav">
        <GlassCard elevated className="text-center pt-6 pb-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-bold text-primary">{c.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
          </div>
          <h2 className="text-lg font-semibold text-foreground">{c.full_name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <LoyaltyBadge level={c.loyalty_level} />
            <RetentionBadge status={c.lifecycle_status} />
          </div>
          <div className="flex justify-center gap-2.5 mt-4 flex-wrap">
            {[
              { icon: Phone, label: "Звонок", action: () => { if (c.phone) { window.location.href = `tel:${c.phone.replace(/\s/g, "")}`; } else toast.error("Телефон не указан"); } },
              { icon: MessageCircle, label: "Telegram", action: () => { if (c.telegram_username) window.open(`https://t.me/${c.telegram_username.replace("@", "")}`, "_blank"); else toast.error("Telegram не указан"); } },
              { icon: CalendarDays, label: "Запись", action: () => navigate("/calendar") },
              { icon: Bell, label: "Напомнить", action: () => setShowReminder(true) },
              { icon: Edit, label: "Изменить", action: () => setShowEdit(true) },
              { icon: Trash2, label: "Удалить", action: () => setShowDelete(true), destructive: true },
            ].map(a => (
              <button key={a.label} onClick={a.action} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center",
                  a.destructive ? "bg-destructive/10" : "bg-secondary/70"
                )}>
                  <a.icon className={cn("w-4 h-4", a.destructive ? "text-destructive" : "text-foreground/70")} />
                </div>
                <span className={cn("text-[10px] font-medium", a.destructive ? "text-destructive" : "text-muted-foreground")}>{a.label}</span>
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
                <GlassCard key={visit.id} className="py-3" onClick={() => setVisitDetails(visit)}>
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
            {!photos?.length ? <EmptyState icon={ImageIcon} title="Нет фото" description="Фотографии появятся после загрузки" /> : (
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
      <BottomSheet
        open={showReminder}
        onClose={() => setShowReminder(false)}
        title="Напоминание"
        footer={
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateReminder} disabled={createReminder.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
            {createReminder.isPending ? "Сохранение..." : "Создать напоминание"}
          </motion.button>
        }
      >
        <div className="space-y-3 pb-2">
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
        </div>
      </BottomSheet>

      {/* Edit client bottom sheet */}
      <BottomSheet
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Редактировать клиентку"
        footer={
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveEdit} disabled={updateClient.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
            {updateClient.isPending ? "Сохранение..." : "Сохранить изменения"}
          </motion.button>
        }
      >
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Имя *</label>
            <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Телефон</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="+998..." />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Telegram</label>
              <input value={editForm.telegram_username} onChange={(e) => setEditForm({ ...editForm, telegram_username: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="@username" />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Форма</label>
            <div className="flex flex-wrap gap-2">
              {shapes.map(s => (
                <button key={s} type="button" onClick={() => setEditForm({ ...editForm, favorite_shape: editForm.favorite_shape === s ? "" : s })}
                  className={cn("text-xs px-3 py-1.5 rounded-full transition-all", editForm.favorite_shape === s ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground")}>{s}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Длина</label>
            <div className="flex flex-wrap gap-2">
              {lengths.map(l => (
                <button key={l} type="button" onClick={() => setEditForm({ ...editForm, favorite_length: editForm.favorite_length === l ? "" : l })}
                  className={cn("text-xs px-3 py-1.5 rounded-full transition-all", editForm.favorite_length === l ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground")}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Любимые цвета</label>
            <input value={editForm.favorite_colors} onChange={(e) => setEditForm({ ...editForm, favorite_colors: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Розовый, нюд, бордо..." />
            <p className="text-[10px] text-muted-foreground mt-1">Через запятую</p>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Любимые дизайны</label>
            <input value={editForm.favorite_designs} onChange={(e) => setEditForm({ ...editForm, favorite_designs: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Френч, омбре..." />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Аллергии</label>
            <input value={editForm.allergies} onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Заметки</label>
            <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2}
              className="w-full px-4 py-3 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none resize-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Дата напоминания</label>
            <input type="date" value={editForm.manual_reminder_date} onChange={(e) => setEditForm({ ...editForm, manual_reminder_date: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Статус</label>
            <div className="flex flex-wrap gap-2">
              {lifecycles.map(l => (
                <button key={l.value} type="button" onClick={() => setEditForm({ ...editForm, lifecycle_status: l.value })}
                  className={cn("text-xs px-3 py-1.5 rounded-full transition-all", editForm.lifecycle_status === l.value ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground")}>{l.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Лояльность</label>
            <div className="flex flex-wrap gap-2">
              {loyalties.map(l => (
                <button key={l.value} type="button" onClick={() => setEditForm({ ...editForm, loyalty_level: l.value })}
                  className={cn("text-xs px-3 py-1.5 rounded-full transition-all", editForm.loyalty_level === l.value ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground")}>{l.label}</button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={showDelete}
        onConfirm={() => { deleteClient.mutate(c.id); setShowDelete(false); navigate("/clients"); }}
        onCancel={() => setShowDelete(false)}
        title="Удалить клиентку?"
        description="Все визиты, фото, записи, доходы и напоминания этой клиентки будут безвозвратно удалены. Это действие нельзя отменить."
        confirmLabel="Удалить навсегда"
      />

      {/* Visit details */}
      <BottomSheet
        open={!!visitDetails}
        onClose={() => setVisitDetails(null)}
        title="Детали визита"
      >
        {visitDetails && (
          <div className="space-y-3 pb-2">
            <GlassCard className="text-center py-4">
              <p className="text-xs text-muted-foreground">Дата визита</p>
              <p className="text-base font-semibold text-foreground mt-0.5">
                {format(new Date(visitDetails.visit_date), "d MMMM yyyy, HH:mm", { locale: ru })}
              </p>
            </GlassCard>

            <GlassCard className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Сумма</span>
              <span className="text-base font-bold text-primary">{formatMoney(visitDetails.total_price)} сум</span>
            </GlassCard>

            {visitDetails.services_performed && visitDetails.services_performed.length > 0 && (
              <GlassCard>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-2">Услуги</p>
                <div className="flex flex-wrap gap-1.5">
                  {visitDetails.services_performed.map((s) => (
                    <span key={s} className="text-[11px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{s}</span>
                  ))}
                </div>
              </GlassCard>
            )}

            {(visitDetails.colors_used?.length || visitDetails.nail_shape || visitDetails.nail_length) && (
              <GlassCard className="space-y-2">
                {visitDetails.colors_used && visitDetails.colors_used.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1">Цвета</p>
                    <div className="flex flex-wrap gap-1.5">
                      {visitDetails.colors_used.map((color) => (
                        <span key={color} className="text-[11px] bg-primary/8 text-primary px-2.5 py-1 rounded-full">{color}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-6">
                  {visitDetails.nail_shape && <div><p className="text-[10px] text-muted-foreground mb-0.5">Форма</p><p className="text-sm font-medium text-foreground">{visitDetails.nail_shape}</p></div>}
                  {visitDetails.nail_length && <div><p className="text-[10px] text-muted-foreground mb-0.5">Длина</p><p className="text-sm font-medium text-foreground">{visitDetails.nail_length}</p></div>}
                </div>
              </GlassCard>
            )}

            {visitDetails.design_notes && (
              <GlassCard>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">Дизайн</p>
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{visitDetails.design_notes}</p>
              </GlassCard>
            )}

            {visitDetails.private_notes && (
              <GlassCard>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5">Личные заметки</p>
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{visitDetails.private_notes}</p>
              </GlassCard>
            )}

            <GlassCard className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Оплата</span>
              <span className="text-xs font-semibold text-foreground">
                {visitDetails.payment_received ? "Получена" : "Не получена"} · {visitDetails.payment_method}
              </span>
            </GlassCard>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
