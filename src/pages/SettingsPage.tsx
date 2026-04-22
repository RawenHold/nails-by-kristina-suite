import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useServices, useCreateService, useUpdateService, useDeleteService, type Service } from "@/hooks/useServices";
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory } from "@/hooks/useExpenses";
import { useMessageTemplates, useCreateMessageTemplate, useUpdateMessageTemplate, useDeleteMessageTemplate, type MessageTemplate } from "@/hooks/useMessageTemplates";
import { Sun, Moon, Monitor, LogOut, Plus, Wrench, Tag, MessageSquare, X, Pencil, Trash2 } from "lucide-react";
import MasterProfileCard from "@/components/settings/MasterProfileCard";
import BackupCard from "@/components/settings/BackupCard";
import ChangePasswordCard from "@/components/settings/ChangePasswordCard";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn, formatMoney } from "@/lib/utils";

type ServiceFormState = { id?: string; name: string; default_price: string; duration_minutes: string; category: string };
type CategoryFormState = { id?: string; name: string };
type TemplateFormState = { id?: string; title: string; body: string };

const emptyService: ServiceFormState = { name: "", default_price: "", duration_minutes: "60", category: "" };
const emptyCategory: CategoryFormState = { name: "" };
const emptyTemplate: TemplateFormState = { title: "", body: "" };

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: services } = useServices();
  const { data: categories } = useExpenseCategories();
  const { data: templates } = useMessageTemplates();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();
  const createTemplate = useCreateMessageTemplate();
  const updateTemplate = useUpdateMessageTemplate();
  const deleteTemplate = useDeleteMessageTemplate();
  const navigate = useNavigate();

  const [serviceForm, setServiceForm] = useState<ServiceFormState | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState | null>(null);
  const [templateForm, setTemplateForm] = useState<TemplateFormState | null>(null);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const submitService = async () => {
    if (!serviceForm) return;
    if (!serviceForm.name.trim()) { toast.error("Укажите название"); return; }
    const payload = {
      name: serviceForm.name.trim(),
      default_price: parseInt(serviceForm.default_price) || 0,
      duration_minutes: parseInt(serviceForm.duration_minutes) || 60,
      category: serviceForm.category.trim() || null,
    };
    if (serviceForm.id) {
      await updateService.mutateAsync({ id: serviceForm.id, ...payload });
    } else {
      await createService.mutateAsync(payload);
    }
    setServiceForm(null);
  };

  const submitCategory = async () => {
    if (!categoryForm) return;
    if (!categoryForm.name.trim()) { toast.error("Укажите название"); return; }
    if (categoryForm.id) {
      await updateCategory.mutateAsync({ id: categoryForm.id, name: categoryForm.name.trim() });
    } else {
      await createCategory.mutateAsync(categoryForm.name.trim());
    }
    setCategoryForm(null);
  };

  const submitTemplate = async () => {
    if (!templateForm) return;
    if (!templateForm.title.trim() || !templateForm.body.trim()) { toast.error("Заполните все поля"); return; }
    if (templateForm.id) {
      await updateTemplate.mutateAsync({ id: templateForm.id, title: templateForm.title.trim(), body: templateForm.body });
    } else {
      await createTemplate.mutateAsync({ title: templateForm.title.trim(), body: templateForm.body });
    }
    setTemplateForm(null);
  };

  const confirmDelete = (label: string) => window.confirm(`Удалить «${label}»?`);

  const themes = [
    { value: "light" as const, icon: Sun, label: "Светлая" },
    { value: "dark" as const, icon: Moon, label: "Тёмная" },
    { value: "system" as const, icon: Monitor, label: "Системная" },
  ];

  return (
    <div>
      <PageHeader title="Настройки" showBack />
      <div className="px-4 space-y-4 pb-nav">
        {/* Master profile */}
        <MasterProfileCard />

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
            <button onClick={() => setServiceForm({ ...emptyService })} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90"><Plus className="w-3.5 h-3.5 text-primary" /></button>
          </div>
          {services?.length === 0 ? <p className="text-xs text-muted-foreground">Нет услуг</p> : (
            <div className="space-y-1">
              {services?.map((s: Service) => (
                <div key={s.id} className="flex items-center gap-2 py-1.5 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatMoney(s.default_price)} сум · {s.duration_minutes} мин</p>
                  </div>
                  <button onClick={() => setServiceForm({ id: s.id, name: s.name, default_price: String(s.default_price), duration_minutes: String(s.duration_minutes), category: s.category ?? "" })}
                    className="w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center active:scale-90"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => { if (confirmDelete(s.name)) deleteService.mutate(s.id); }}
                    className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center active:scale-90"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Expense Categories */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-primary" /> Категории расходов</p>
            <button onClick={() => setCategoryForm({ ...emptyCategory })} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90"><Plus className="w-3.5 h-3.5 text-primary" /></button>
          </div>
          {categories?.length === 0 ? <p className="text-xs text-muted-foreground">Нет категорий</p> : (
            <div className="space-y-1">
              {categories?.map(c => (
                <div key={c.id} className="flex items-center gap-2 py-1.5">
                  <span className="flex-1 min-w-0 truncate text-xs text-foreground">{c.name}</span>
                  <button onClick={() => setCategoryForm({ id: c.id, name: c.name })}
                    className="w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center active:scale-90"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => { if (confirmDelete(c.name)) deleteCategory.mutate(c.id); }}
                    className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center active:scale-90"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Message Templates */}
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-primary" /> Шаблоны сообщений</p>
            <button onClick={() => setTemplateForm({ ...emptyTemplate })} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90"><Plus className="w-3.5 h-3.5 text-primary" /></button>
          </div>
          {templates?.length === 0 ? <p className="text-xs text-muted-foreground">Нет шаблонов</p> : (
            <div className="space-y-1">
              {templates?.map((t: MessageTemplate) => (
                <div key={t.id} className="flex items-start gap-2 py-1.5">
                  <button
                    onClick={() => { navigator.clipboard.writeText(t.body); toast.success("Текст скопирован"); }}
                    className="flex-1 min-w-0 text-left active:opacity-70"
                  >
                    <p className="text-xs font-medium text-foreground truncate">{t.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{t.body}</p>
                  </button>
                  <button onClick={() => setTemplateForm({ id: t.id, title: t.title, body: t.body })}
                    className="w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center active:scale-90 shrink-0"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => { if (confirmDelete(t.title)) deleteTemplate.mutate(t.id); }}
                    className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center active:scale-90 shrink-0"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Backup & restore */}
        <BackupCard />

        {/* Change password */}
        <ChangePasswordCard />

        {/* Sign out */}
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSignOut}
          className="w-full h-12 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" /> Выйти
        </motion.button>
      </div>

      {/* Service form */}
      <AnimatePresence>
        {serviceForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-bottom-sheet="open" data-no-swipe-nav className="fixed inset-0 z-[60] bg-black/40" onClick={() => setServiceForm(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">{serviceForm.id ? "Редактировать услугу" : "Новая услуга"}</h2>
                <button onClick={() => setServiceForm(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Название услуги" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={serviceForm.default_price} onChange={(e) => setServiceForm({ ...serviceForm, default_price: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Цена (сум)" />
                  <input type="number" value={serviceForm.duration_minutes} onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Минут" />
                </div>
                <input value={serviceForm.category} onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Категория (необязательно)" />
                <motion.button whileTap={{ scale: 0.97 }} onClick={submitService} disabled={createService.isPending || updateService.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createService.isPending || updateService.isPending ? "Сохранение..." : serviceForm.id ? "Сохранить" : "Добавить услугу"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category form */}
      <AnimatePresence>
        {categoryForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-bottom-sheet="open" data-no-swipe-nav className="fixed inset-0 z-[60] bg-black/40" onClick={() => setCategoryForm(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">{categoryForm.id ? "Редактировать категорию" : "Новая категория"}</h2>
              <input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3" placeholder="Название категории" />
              <motion.button whileTap={{ scale: 0.97 }} onClick={submitCategory} disabled={createCategory.isPending || updateCategory.isPending}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">{categoryForm.id ? "Сохранить" : "Добавить"}</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template form */}
      <AnimatePresence>
        {templateForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-bottom-sheet="open" data-no-swipe-nav className="fixed inset-0 z-[60] bg-black/40" onClick={() => setTemplateForm(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">{templateForm.id ? "Редактировать шаблон" : "Новый шаблон"}</h2>
              <div className="space-y-3">
                <input value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="Название шаблона" />
                <textarea value={templateForm.body} onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })} rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" placeholder="Текст сообщения..." />
                <motion.button whileTap={{ scale: 0.97 }} onClick={submitTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">{templateForm.id ? "Сохранить" : "Добавить шаблон"}</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
