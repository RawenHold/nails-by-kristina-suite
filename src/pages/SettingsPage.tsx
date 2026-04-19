import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useServices, useCreateService } from "@/hooks/useServices";
import { useExpenseCategories, useCreateExpenseCategory } from "@/hooks/useExpenses";
import { useMessageTemplates, useCreateMessageTemplate } from "@/hooks/useMessageTemplates";
import { Sun, Moon, Monitor, LogOut, Plus, Sparkles, Wrench, Tag, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn, formatMoney } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: services } = useServices();
  const { data: categories } = useExpenseCategories();
  const { data: templates } = useMessageTemplates();
  const createService = useCreateService();
  const createCategory = useCreateExpenseCategory();
  const createTemplate = useCreateMessageTemplate();
  const navigate = useNavigate();

  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [svcForm, setSvcForm] = useState({ name: "", default_price: "", duration_minutes: "60", category: "" });
  const [catName, setCatName] = useState("");
  const [tplForm, setTplForm] = useState({ title: "", body: "" });

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleCreateService = async () => {
    if (!svcForm.name.trim()) { toast.error("Укажите название"); return; }
    await createService.mutateAsync({ name: svcForm.name, default_price: parseInt(svcForm.default_price) || 0, duration_minutes: parseInt(svcForm.duration_minutes) || 60, category: svcForm.category || null });
    setShowServiceForm(false);
    setSvcForm({ name: "", default_price: "", duration_minutes: "60", category: "" });
  };

  const handleCreateCategory = async () => {
    if (!catName.trim()) { toast.error("Укажите название"); return; }
    await createCategory.mutateAsync(catName.trim());
    setShowCategoryForm(false);
    setCatName("");
  };

  const handleCreateTemplate = async () => {
    if (!tplForm.title.trim() || !tplForm.body.trim()) { toast.error("Заполните все поля"); return; }
    await createTemplate.mutateAsync(tplForm);
    setShowTemplateForm(false);
    setTplForm({ title: "", body: "" });
  };

  const themes = [
    { value: "light" as const, icon: Sun, label: "Светлая" },
    { value: "dark" as const, icon: Moon, label: "Тёмная" },
    { value: "system" as const, icon: Monitor, label: "Системная" },
  ];

  return (
    <div className="min-h-screen pb-6">
      <PageHeader title="Настройки" showBack />
      <div className="px-4 space-y-4 pb-nav">
        {/* Profile */}
        <GlassCard elevated className="flex items-center gap-3 py-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Nails by Kristina</p>
            <p className="text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </GlassCard>

        {/* Theme */}
        <GlassCard>
          <p className="text-xs font-semibold text-foreground mb-3">Тема оформления</p>
          <div className="flex gap-2">
            {themes.map(t => (
              <button key={t.value} onClick={() => setTheme(t.value)}
                className={cn("flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all",
                  theme === t.value ? "bg-primary/10 ring-2 ring-primary/20" : "bg-secondary/50")}>
                <t.icon className={cn("w-5 h-5", theme === t.value ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-[11px] font-medium", theme === t.value ? "text-primary" : "text-muted-foreground")}>{t.label}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Services */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5 text-primary" /> Услуги</p>
            <button onClick={() => setShowServiceForm(true)} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90"><Plus className="w-3.5 h-3.5 text-primary" /></button>
          </div>
          {services?.length === 0 ? <p className="text-xs text-muted-foreground">Нет услуг</p> : (
            <div className="space-y-1.5">
              {services?.map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-foreground">{s.name}</span>
                  <span className="text-[11px] text-muted-foreground">{formatMoney(s.default_price)} сум · {s.duration_minutes} мин</span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Expense Categories */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-primary" /> Категории расходов</p>
            <button onClick={() => setShowCategoryForm(true)} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90"><Plus className="w-3.5 h-3.5 text-primary" /></button>
          </div>
          {categories?.length === 0 ? <p className="text-xs text-muted-foreground">Нет категорий</p> : (
            <div className="flex flex-wrap gap-1.5">
              {categories?.map(c => <span key={c.id} className="text-[11px] bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{c.name}</span>)}
            </div>
          )}
        </GlassCard>

        {/* Message Templates */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-primary" /> Шаблоны сообщений</p>
            <button onClick={() => setShowTemplateForm(true)} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90"><Plus className="w-3.5 h-3.5 text-primary" /></button>
          </div>
          {templates?.length === 0 ? <p className="text-xs text-muted-foreground">Нет шаблонов</p> : (
            <div className="space-y-1.5">
              {templates?.map(t => (
                <div key={t.id} className="py-1.5 cursor-pointer active:opacity-70" onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Текст скопирован"); }}>
                  <p className="text-xs font-medium text-foreground">{t.title}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{t.body}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Sign out */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSignOut}
          className="w-full h-12 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Выйти
        </motion.button>
      </div>

      {/* Service form */}
      <AnimatePresence>
        {showServiceForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowServiceForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">Новая услуга</h2>
                <button onClick={() => setShowServiceForm(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input value={svcForm.name} onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Название услуги" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={svcForm.default_price} onChange={(e) => setSvcForm({ ...svcForm, default_price: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Цена (сум)" />
                  <input type="number" value={svcForm.duration_minutes} onChange={(e) => setSvcForm({ ...svcForm, duration_minutes: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Минут" />
                </div>
                <input value={svcForm.category} onChange={(e) => setSvcForm({ ...svcForm, category: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Категория (необязательно)" />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateService} disabled={createService.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createService.isPending ? "Сохранение..." : "Добавить услугу"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category form */}
      <AnimatePresence>
        {showCategoryForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowCategoryForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">Новая категория</h2>
              <input value={catName} onChange={(e) => setCatName(e.target.value)}
                className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3" placeholder="Название категории" />
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateCategory}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20">Добавить</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template form */}
      <AnimatePresence>
        {showTemplateForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowTemplateForm(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">Новый шаблон</h2>
              <div className="space-y-3">
                <input value={tplForm.title} onChange={(e) => setTplForm({ ...tplForm, title: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Название шаблона" />
                <textarea value={tplForm.body} onChange={(e) => setTplForm({ ...tplForm, body: e.target.value })} rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Текст сообщения..." />
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreateTemplate}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20">Добавить шаблон</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
