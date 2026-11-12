import { commitActiveInput, commitTextInput } from "@/lib/ime";
import { useState, useRef, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { useServices, useCreateService, useUpdateService, useDeleteService, type Service } from "@/hooks/useServices";
import { Plus, Wrench, X, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";

type ServiceInitial = { id?: string; name: string; default_price: string; duration_minutes: string; category: string };
const emptyService: ServiceInitial = { name: "", default_price: "", duration_minutes: "60", category: "" };

export default function ServicesSettingsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { data: services } = useServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const [serviceForm, setServiceForm] = useState<ServiceInitial | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const durationRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLInputElement>(null);

  const nameLatest = useRef("");
  const priceLatest = useRef("");
  const durationLatest = useRef("60");
  const categoryLatest = useRef("");

  useEffect(() => {
    if (serviceForm) {
      nameLatest.current = serviceForm.name;
      priceLatest.current = serviceForm.default_price;
      durationLatest.current = serviceForm.duration_minutes;
      categoryLatest.current = serviceForm.category;
    }
  }, [serviceForm]);

  const readLatest = (refVal: string | undefined, latest: string) => (refVal ?? latest ?? "").trim();

  const submit = async () => {
    await commitTextInput();
    if (!serviceForm) return;
    const name = readLatest(nameRef.current?.value, nameLatest.current);
    const priceRaw = readLatest(priceRef.current?.value, priceLatest.current);
    const durationRaw = readLatest(durationRef.current?.value, durationLatest.current);
    const category = readLatest(categoryRef.current?.value, categoryLatest.current);
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

  const confirmDelete = (label: string) => window.confirm(`Удалить «${label}»?`);

  return (
    <div>
      {!embedded && <PageHeader title="Услуги" showBack hideSettings />}
      <div className="px-4 space-y-4 pb-nav">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-primary" /> Все услуги
            </p>
            <button onClick={() => setServiceForm({ ...emptyService })} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90">
              <Plus className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
          {services?.length === 0 ? (
            <p className="text-xs text-muted-foreground">Нет услуг</p>
          ) : (
            <div className="space-y-1">
              {services?.map((s: Service) => (
                <div key={s.id} className="flex items-center gap-2 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatMoney(s.default_price)} сум · {s.duration_minutes} мин</p>
                  </div>
                  <button onClick={() => setServiceForm({ id: s.id, name: s.name, default_price: String(s.default_price), duration_minutes: String(s.duration_minutes), category: s.category ?? "" })}
                    className="w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center active:scale-90">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => { if (confirmDelete(s.name)) deleteService.mutate(s.id); }}
                    className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center active:scale-90">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      <AnimatePresence>
        {serviceForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-bottom-sheet="open" data-no-swipe-nav className="fixed inset-0 z-[60] bg-black/40" onClick={() => setServiceForm(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} data-no-swipe-nav className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display font-semibold text-foreground">{serviceForm.id ? "Редактировать услугу" : "Новая услуга"}</h2>
                <button onClick={() => setServiceForm(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"><X className="w-4 h-4" /></button>
              </div>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void submit().catch(() => { /* Mutation reports the error; retain draft. */ }); }}>
                <input ref={nameRef} defaultValue={serviceForm.name}
                  onInput={(e) => { nameLatest.current = (e.target as HTMLInputElement).value; }}
                  onCompositionEnd={(e) => { nameLatest.current = (e.target as HTMLInputElement).value; }}
                  lang="ru" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Название услуги" />
                <div className="grid grid-cols-2 gap-2">
                  <input ref={priceRef} type="number" inputMode="numeric" defaultValue={serviceForm.default_price}
                    onInput={(e) => { priceLatest.current = (e.target as HTMLInputElement).value; }}
                    autoComplete="off"
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none"
                    placeholder="Цена (сум)" />
                  <input ref={durationRef} type="number" inputMode="numeric" defaultValue={serviceForm.duration_minutes}
                    onInput={(e) => { durationLatest.current = (e.target as HTMLInputElement).value; }}
                    autoComplete="off"
                    className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none"
                    placeholder="Минут" />
                </div>
                <input ref={categoryRef} defaultValue={serviceForm.category}
                  onInput={(e) => { categoryLatest.current = (e.target as HTMLInputElement).value; }}
                  onCompositionEnd={(e) => { categoryLatest.current = (e.target as HTMLInputElement).value; }}
                  lang="ru" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none"
                  placeholder="Категория (необязательно)" />
                <motion.button whileTap={{ scale: 0.97 }} type="submit" onPointerDown={commitActiveInput}
                  disabled={createService.isPending || updateService.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
                  {createService.isPending || updateService.isPending ? "Сохранение..." : serviceForm.id ? "Сохранить" : "Добавить услугу"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
