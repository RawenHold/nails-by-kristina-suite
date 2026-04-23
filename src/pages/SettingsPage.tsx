import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { useServices, useCreateService, useUpdateService, useDeleteService, type Service } from "@/hooks/useServices";
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory } from "@/hooks/useExpenses";
import { Sun, Moon, Monitor, LogOut, Plus, Wrench, Tag, X, Pencil, Trash2 } from "lucide-react";
import MasterProfileCard from "@/components/settings/MasterProfileCard";
import BackupCard from "@/components/settings/BackupCard";
import ChangePasswordCard from "@/components/settings/ChangePasswordCard";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn, formatMoney } from "@/lib/utils";

type ServiceInitial = { id?: string; name: string; default_price: string; duration_minutes: string; category: string };
type CategoryInitial = { id?: string; name: string };

const emptyService: ServiceInitial = { name: "", default_price: "", duration_minutes: "60", category: "" };
const emptyCategory: CategoryInitial = { name: "" };

/**
 * Helper: read input value safely on Android WebView.
 * Forces the IME composition to commit by blurring the active element first.
 * This prevents losing the last typed character / partial words when the user
 * taps "Save" before the input loses focus naturally.
 */
function commitActiveInput() {
  const el = document.activeElement as HTMLElement | null;
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
    el.blur();
  }
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { data: services } = useServices();
  const { data: categories } = useExpenseCategories();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();
  const navigate = useNavigate();

  // Store only the "is open + initial values + edit id". The actual current
  // values live in the DOM via refs, which is bullet-proof against Android
  // IME composition issues that drop characters with controlled inputs.
  const [serviceForm, setServiceForm] = useState<ServiceInitial | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryInitial | null>(null);

  const serviceNameRef = useRef<HTMLInputElement>(null);
  const servicePriceRef = useRef<HTMLInputElement>(null);
  const serviceDurationRef = useRef<HTMLInputElement>(null);
  const serviceCategoryRef = useRef<HTMLInputElement>(null);
  const categoryNameRef = useRef<HTMLInputElement>(null);

  // IME-safe latest-value capture: onInput fires for every keystroke including
  // IME composition updates, so even if the user types a space and a new word
  // ("Гель лак") and taps Save before composition end, we still have the full value.
  const serviceNameLatest = useRef<string>("");
  const serviceCategoryLatest = useRef<string>("");
  const categoryNameLatest = useRef<string>("");

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  // Reset captured "latest" values whenever a form is opened.
  useEffect(() => {
    if (serviceForm) {
      serviceNameLatest.current = serviceForm.name;
      serviceCategoryLatest.current = serviceForm.category;
    }
  }, [serviceForm]);
  useEffect(() => {
    if (categoryForm) categoryNameLatest.current = categoryForm.name;
  }, [categoryForm]);

  /**
   * Read input value, preferring the longest of:
   *  - DOM value (most reliable when not in active IME composition)
   *  - latest captured value via onInput (catches partial composition)
   * This prevents losing the tail of words like "Гель лак" → "Гель" on Android.
   */
  const readBest = (refVal: string | undefined, latest: string) => {
    const dom = (refVal ?? "").trim();
    const lat = (latest ?? "").trim();
    return dom.length >= lat.length ? dom : lat;
  };

  const submitService = async () => {
    if (!serviceForm) return;
    commitActiveInput();
    // Slightly longer delay to let Android IME flush composition end.
    await new Promise((r) => setTimeout(r, 120));
    const name = readBest(serviceNameRef.current?.value, serviceNameLatest.current);
    const priceRaw = (servicePriceRef.current?.value ?? "").trim();
    const durationRaw = (serviceDurationRef.current?.value ?? "").trim();
    const category = readBest(serviceCategoryRef.current?.value, serviceCategoryLatest.current);
    if (!name) { toast.error("Укажите название услуги"); return; }
    const payload = {
      name,
      default_price: parseInt(priceRaw) || 0,
      duration_minutes: parseInt(durationRaw) || 60,
      category: category || null,
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
    commitActiveInput();
    await new Promise((r) => setTimeout(r, 120));
    const name = readBest(categoryNameRef.current?.value, categoryNameLatest.current);
    if (!name) { toast.error("Укажите название категории"); return; }
    if (categoryForm.id) {
      await updateCategory.mutateAsync({ id: categoryForm.id, name });
    } else {
      await createCategory.mutateAsync(name);
    }
    setCategoryForm(null);
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
              onClick={(e) => e.stopPropagation()} data-no-swipe-nav className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">{serviceForm.id ? "Редактировать услугу" : "Новая услуга"}</h2>
                <button onClick={() => setServiceForm(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input
                  ref={serviceNameRef}
                  defaultValue={serviceForm.name}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Название услуги"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={servicePriceRef}
                    type="number"
                    inputMode="numeric"
                    defaultValue={serviceForm.default_price}
                    autoComplete="off"
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none"
                    placeholder="Цена (сум)"
                  />
                  <input
                    ref={serviceDurationRef}
                    type="number"
                    inputMode="numeric"
                    defaultValue={serviceForm.duration_minutes}
                    autoComplete="off"
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none"
                    placeholder="Минут"
                  />
                </div>
                <input
                  ref={serviceCategoryRef}
                  defaultValue={serviceForm.category}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none"
                  placeholder="Категория (необязательно)"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onPointerDown={commitActiveInput}
                  onClick={submitService}
                  disabled={createService.isPending || updateService.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
                >
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
              onClick={(e) => e.stopPropagation()} data-no-swipe-nav className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">{categoryForm.id ? "Редактировать категорию" : "Новая категория"}</h2>
              <input
                ref={categoryNameRef}
                defaultValue={categoryForm.name}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                spellCheck={false}
                className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                placeholder="Название категории"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onPointerDown={commitActiveInput}
                onClick={submitCategory}
                disabled={createCategory.isPending || updateCategory.isPending}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {categoryForm.id ? "Сохранить" : "Добавить"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
