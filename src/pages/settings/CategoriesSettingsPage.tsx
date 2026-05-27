import { useState, useRef, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory } from "@/hooks/useExpenses";
import { Plus, Tag, Pencil, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type CategoryInitial = { id?: string; name: string };

export default function CategoriesSettingsPage({ embedded = false }: { embedded?: boolean } = {}) {
  const { data: categories } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();

  const [categoryForm, setCategoryForm] = useState<CategoryInitial | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const nameLatest = useRef("");

  useEffect(() => {
    if (categoryForm) nameLatest.current = categoryForm.name;
  }, [categoryForm]);

  const submit = async () => {
    if (!categoryForm) return;
    const name = (nameLatest.current ?? nameRef.current?.value ?? "").trim();
    if (!name) { toast.error("Укажите название категории"); return; }
    if (categoryForm.id) {
      await updateCategory.mutateAsync({ id: categoryForm.id, name });
    } else {
      await createCategory.mutateAsync(name);
    }
    setCategoryForm(null);
  };

  const confirmDelete = (label: string) => window.confirm(`Удалить «${label}»?`);

  return (
    <div>
      {!embedded && <PageHeader title="Категории расходов" showBack hideSettings />}
      <div className="px-4 space-y-4 pb-nav">
        <GlassCard>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-primary" /> Все категории
            </p>
            <button onClick={() => setCategoryForm({ name: "" })} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center active:scale-90">
              <Plus className="w-3.5 h-3.5 text-primary" />
            </button>
          </div>
          {categories?.length === 0 ? (
            <p className="text-xs text-muted-foreground">Нет категорий</p>
          ) : (
            <div className="space-y-1">
              {categories?.map((c) => (
                <div key={c.id} className="flex items-center gap-2 py-1.5">
                  <span className="flex-1 min-w-0 truncate text-xs text-foreground">{c.name}</span>
                  <button onClick={() => setCategoryForm({ id: c.id, name: c.name })}
                    className="w-8 h-8 rounded-full bg-secondary/70 flex items-center justify-center active:scale-90">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => { if (confirmDelete(c.name)) deleteCategory.mutate(c.id); }}
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
        {categoryForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-bottom-sheet="open" data-no-swipe-nav className="fixed inset-0 z-[60] bg-black/40" onClick={() => setCategoryForm(null)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} data-no-swipe-nav className="absolute bottom-0 inset-x-0 bg-background rounded-t-3xl p-5 safe-bottom">
              <h2 className="text-lg font-display font-semibold text-foreground mb-4">{categoryForm.id ? "Редактировать категорию" : "Новая категория"}</h2>
              <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
                <input ref={nameRef} defaultValue={categoryForm.name}
                  onInput={(e) => { nameLatest.current = (e.target as HTMLInputElement).value; }}
                  onCompositionEnd={(e) => { nameLatest.current = (e.target as HTMLInputElement).value; }}
                  lang="ru" autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
                  className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 mb-3"
                  placeholder="Название категории" />
                <motion.button whileTap={{ scale: 0.97 }} type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50">
                  {categoryForm.id ? "Сохранить" : "Добавить"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
