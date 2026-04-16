import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import EmptyState from "@/components/ui/EmptyState";
import LoyaltyBadge from "@/components/ui/LoyaltyBadge";
import RetentionBadge from "@/components/ui/RetentionBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Search, Phone, Users, ChevronRight, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useClients, useCreateClient, useDeleteClient } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";

const filters = ["Все", "VIP", "Активные", "Неактивные", "Потерянные", "Новые"];
const filterMap: Record<string, string> = { "Все": "all", "VIP": "vip", "Активные": "active", "Неактивные": "inactive", "Потерянные": "lost", "Новые": "new" };

const shapes = ["Миндаль", "Квадрат", "Овал", "Балерина", "Стилет"];
const lengths = ["Короткие", "Средние", "Длинные"];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Все");
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", telegram_username: "", notes: "", favorite_shape: "", favorite_length: "", allergies: "" });
  const navigate = useNavigate();

  const { data: clients, isLoading } = useClients({ search, lifecycle: filterMap[activeFilter] });
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();

  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  const handleCreate = async () => {
    if (!form.full_name.trim()) { toast.error("Укажите имя клиентки"); return; }
    await createClient.mutateAsync({
      full_name: form.full_name.trim(),
      phone: form.phone || null,
      telegram_username: form.telegram_username || null,
      notes: form.notes || null,
      favorite_shape: form.favorite_shape || null,
      favorite_length: form.favorite_length || null,
      allergies: form.allergies || null,
    });
    setShowForm(false);
    setForm({ full_name: "", phone: "", telegram_username: "", notes: "", favorite_shape: "", favorite_length: "", allergies: "" });
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Клиенты" subtitle={`${clients?.length || 0} клиенток`} />
      <div className="px-4 space-y-3 pb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени или телефону..."
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-secondary/70 text-foreground text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/20 transition placeholder:text-muted-foreground/60" />
        </div>

        <ChipGroup options={filters} selected={activeFilter} onChange={setActiveFilter} />

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl shimmer" />)}</div>
        ) : !clients?.length ? (
          <EmptyState icon={Users} title="Нет клиенток" description="Добавьте первую клиентку" />
        ) : (
          <div className="space-y-2">
            {clients.map((client, i) => (
              <motion.div key={client.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard onClick={() => navigate(`/clients/${client.id}`)} className="flex items-center gap-3 py-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                    {client.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-sm font-semibold text-foreground truncate">{client.full_name}</span>
                      <LoyaltyBadge level={client.loyalty_level} showLabel={false} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{client.total_visits} визитов</span>
                      <span className="text-[11px] text-muted-foreground">•</span>
                      <span className="text-[11px] text-muted-foreground">{formatCurrency(client.total_spent)} сум</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <RetentionBadge status={client.lifecycle_status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {client.phone && (
                      <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(client.phone!); toast.success("Телефон скопирован"); }}
                        className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center active:scale-90 transition-transform">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create form bottom sheet */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">Новая клиентка</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Имя *</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Анна Каримова" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Телефон</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="+998 90 123 4567" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Telegram</label>
                  <input value={form.telegram_username} onChange={(e) => setForm({ ...form, telegram_username: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="@username" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Форма ногтей</label>
                  <div className="flex flex-wrap gap-2">
                    {shapes.map(s => (
                      <button key={s} onClick={() => setForm({ ...form, favorite_shape: form.favorite_shape === s ? "" : s })}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all ${form.favorite_shape === s ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground"}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Длина</label>
                  <div className="flex flex-wrap gap-2">
                    {lengths.map(l => (
                      <button key={l} onClick={() => setForm({ ...form, favorite_length: form.favorite_length === l ? "" : l })}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all ${form.favorite_length === l ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground"}`}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Аллергии</label>
                  <input value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Чувствительность к материалам..." />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase tracking-wide">Заметки</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2}
                    className="w-full px-4 py-3 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Любые заметки..." />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={createClient.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createClient.isPending ? "Сохранение..." : "Добавить клиентку"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!deleteId} onConfirm={() => { if (deleteId) deleteClient.mutate(deleteId); setDeleteId(null); }}
        onCancel={() => setDeleteId(null)} title="Архивировать клиентку?" description="Клиентка будет перемещена в архив." />

      <FloatingActionButton onClick={() => setShowForm(true)} />
    </div>
  );
}
