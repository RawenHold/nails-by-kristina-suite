import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import BottomSheet from "@/components/ui/BottomSheet";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { ArrowUpRight, ArrowDownRight, Wallet, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useIncomes, useCreateIncome, useDeleteIncome } from "@/hooks/useIncomes";
import { useExpenses, useCreateExpense, useDeleteExpense, useExpenseCategories } from "@/hooks/useExpenses";
import { useClients } from "@/hooks/useClients";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const tabs = ["Обзор", "Доходы", "Расходы"];
const paymentMethods = [
  { value: "cash", label: "Наличные" },
  { value: "card", label: "Карта" },
  { value: "transfer", label: "Перевод" },
];

type PaymentMethod = "cash" | "card" | "transfer" | "other";

export default function FinancesPage() {
  const [month, setMonth] = useState(new Date());
  const [tab, setTab] = useState("Обзор");
  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "income" | "expense" } | null>(null);
  const [incomeForm, setIncomeForm] = useState({ amount: "", client_id: "", payment_method: "cash" as PaymentMethod, note: "" });
  const [expenseForm, setExpenseForm] = useState({ amount: "", category_id: "", note: "" });

  const { data: incomes, isLoading: loadingI } = useIncomes(month);
  const { data: expenses, isLoading: loadingE } = useExpenses(month);
  const { data: categories } = useExpenseCategories();
  const { data: clients } = useClients();
  const createIncome = useCreateIncome();
  const createExpense = useCreateExpense();
  const deleteIncome = useDeleteIncome();
  const deleteExpense = useDeleteExpense();

  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);
  const totalIncome = (incomes || []).reduce((s, i) => s + i.amount, 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + e.amount, 0);

  const handleCreateIncome = async () => {
    const amount = parseInt(incomeForm.amount);
    if (!amount || amount <= 0) { toast.error("Укажите сумму"); return; }
    await createIncome.mutateAsync({
      amount,
      client_id: incomeForm.client_id || null,
      payment_method: incomeForm.payment_method,
      note: incomeForm.note || null,
      received_at: new Date().toISOString(),
    });
    setShowIncome(false);
    setIncomeForm({ amount: "", client_id: "", payment_method: "cash", note: "" });
  };

  const handleCreateExpense = async () => {
    const amount = parseInt(expenseForm.amount);
    if (!amount || amount <= 0) { toast.error("Укажите сумму"); return; }
    await createExpense.mutateAsync({
      amount,
      category_id: expenseForm.category_id || null,
      note: expenseForm.note || null,
      spent_at: new Date().toISOString(),
    });
    setShowExpense(false);
    setExpenseForm({ amount: "", category_id: "", note: "" });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "income") deleteIncome.mutate(deleteTarget.id);
    else deleteExpense.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const allTransactions = [
    ...(tab !== "Расходы" ? (incomes || []).map(i => ({ ...i, type: "income" as const, date: i.received_at, desc: i.note || "Оплата", category: i.clients?.full_name || "Клиент" })) : []),
    ...(tab !== "Доходы" ? (expenses || []).map(e => ({ ...e, type: "expense" as const, date: e.spent_at, desc: e.note || "Расход", category: e.expense_categories?.name || "Другое" })) : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen">
      <PageHeader title="Финансы" subtitle="Учёт доходов и расходов" />
      <div className="px-4 space-y-3 pb-4">
        <MonthYearPicker value={month} onChange={setMonth} />

        <div className="grid grid-cols-3 gap-2">
          <GlassCard className="text-center py-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Доходы</p>
            <p className="text-sm font-bold text-success">{formatCurrency(totalIncome)}</p>
          </GlassCard>
          <GlassCard className="text-center py-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Расходы</p>
            <p className="text-sm font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
          </GlassCard>
          <GlassCard className="text-center py-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Прибыль</p>
            <p className="text-sm font-bold text-foreground">{formatCurrency(totalIncome - totalExpenses)}</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowIncome(true)}
            className="h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> Доход
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowExpense(true)}
            className="h-11 rounded-2xl bg-red-50 dark:bg-red-900/20 text-destructive font-semibold text-sm flex items-center justify-center gap-2">
            <ArrowDownRight className="w-4 h-4" /> Расход
          </motion.button>
        </div>

        <ChipGroup options={tabs} selected={tab} onChange={setTab} />

        {loadingI || loadingE ? (
          <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-2xl shimmer" />)}</div>
        ) : !allTransactions.length ? (
          <EmptyState icon={Wallet} title="Нет операций" description="Добавьте первый доход или расход" />
        ) : (
          <div className="space-y-1.5">
            {allTransactions.map((txn, i) => (
              <motion.div key={txn.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard className="flex items-center gap-3 py-3">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                    txn.type === "income" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                    {txn.type === "income" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{txn.desc}</span>
                      <span className={cn("text-sm font-bold shrink-0 ml-2", txn.type === "income" ? "text-success" : "text-destructive")}>
                        {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{txn.category}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(txn.date), "d MMM, HH:mm", { locale: ru })}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: txn.id, type: txn.type }); }}
                    className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center active:scale-90 transition-transform"
                    aria-label="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Income form */}
      <BottomSheet
        open={showIncome}
        onClose={() => setShowIncome(false)}
        title="Новый доход"
        footer={
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateIncome}
            disabled={createIncome.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {createIncome.isPending ? "Сохранение..." : "Записать доход"}
          </motion.button>
        }
      >
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Сумма (сум) *</label>
            <input type="number" inputMode="numeric" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
              className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="350 000" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Клиентка</label>
            <select value={incomeForm.client_id} onChange={(e) => setIncomeForm({ ...incomeForm, client_id: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none">
              <option value="">Без привязки</option>
              {clients?.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Способ оплаты</label>
            <div className="flex gap-2 flex-wrap">
              {paymentMethods.map(pm => (
                <button key={pm.value} onClick={() => setIncomeForm({ ...incomeForm, payment_method: pm.value as PaymentMethod })}
                  className={cn("text-xs px-3 py-1.5 rounded-full transition-all", incomeForm.payment_method === pm.value ? "bg-primary text-primary-foreground" : "bg-secondary/70 text-secondary-foreground")}>{pm.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Заметка</label>
            <input value={incomeForm.note} onChange={(e) => setIncomeForm({ ...incomeForm, note: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Маникюр + дизайн..." />
          </div>
        </div>
      </BottomSheet>

      {/* Expense form */}
      <BottomSheet
        open={showExpense}
        onClose={() => setShowExpense(false)}
        title="Новый расход"
        footer={
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateExpense}
            disabled={createExpense.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {createExpense.isPending ? "Сохранение..." : "Записать расход"}
          </motion.button>
        }
      >
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Сумма (сум) *</label>
            <input type="number" inputMode="numeric" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="150 000" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Категория</label>
            <select value={expenseForm.category_id} onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none">
              <option value="">Без категории</option>
              {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Заметка</label>
            <input value={expenseForm.note} onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
              className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none" placeholder="Материалы, реклама..." />
          </div>
        </div>
      </BottomSheet>

      <ConfirmDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        title="Удалить операцию?"
        description="Это действие нельзя отменить. Финансовые итоги будут пересчитаны."
        confirmLabel="Удалить"
      />
    </div>
  );
}
