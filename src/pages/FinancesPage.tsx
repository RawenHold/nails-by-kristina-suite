import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import ChipGroup from "@/components/ui/ChipGroup";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import BottomSheet from "@/components/ui/BottomSheet";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { ArrowUpRight, ArrowDownRight, Wallet, Trash2, Edit, FileText, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn, formatMoney, parseMoney } from "@/lib/utils";
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome, type Income } from "@/hooks/useIncomes";
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useExpenseCategories, type Expense } from "@/hooks/useExpenses";
import { useClients } from "@/hooks/useClients";
import { useAllTimeStats } from "@/hooks/useAllTimeStats";
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
  const [editIncome, setEditIncome] = useState<Income | null>(null);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: "income" | "expense" } | null>(null);
  const [details, setDetails] = useState<{ type: "income" | "expense"; data: Income | Expense } | null>(null);
  const [incomeForm, setIncomeForm] = useState({ amount: "", client_id: "", payment_method: "cash" as PaymentMethod, note: "" });
  const [expenseForm, setExpenseForm] = useState({ amount: "", category_id: "", note: "" });

  const { data: incomes, isLoading: loadingI } = useIncomes(month);
  const { data: expenses, isLoading: loadingE } = useExpenses(month);
  const { data: categories } = useExpenseCategories();
  const { data: clients } = useClients();
  const { data: allTimeStats } = useAllTimeStats();
  const createIncome = useCreateIncome();
  const updateIncomeMut = useUpdateIncome();
  const createExpense = useCreateExpense();
  const updateExpenseMut = useUpdateExpense();
  const deleteIncome = useDeleteIncome();
  const deleteExpense = useDeleteExpense();

  const totalIncome = (incomes || []).reduce((s, i) => s + i.amount, 0);
  const totalExpenses = (expenses || []).reduce((s, e) => s + e.amount, 0);

  const openCreateIncome = () => {
    setEditIncome(null);
    setIncomeForm({ amount: "", client_id: "", payment_method: "cash", note: "" });
    setShowIncome(true);
  };
  const openEditIncome = (inc: Income) => {
    setEditIncome(inc);
    setIncomeForm({
      amount: formatMoney(inc.amount),
      client_id: inc.client_id || "",
      payment_method: inc.payment_method as PaymentMethod,
      note: inc.note || "",
    });
    setShowIncome(true);
  };
  const openCreateExpense = () => {
    setEditExpense(null);
    setExpenseForm({ amount: "", category_id: "", note: "" });
    setShowExpense(true);
  };
  const openEditExpense = (exp: Expense) => {
    setEditExpense(exp);
    setExpenseForm({
      amount: formatMoney(exp.amount),
      category_id: exp.category_id || "",
      note: exp.note || "",
    });
    setShowExpense(true);
  };

  const handleSaveIncome = async () => {
    const amount = parseMoney(incomeForm.amount);
    if (!amount || amount <= 0) { toast.error("Укажите сумму"); return; }
    if (editIncome) {
      await updateIncomeMut.mutateAsync({
        id: editIncome.id,
        amount,
        client_id: incomeForm.client_id || null,
        payment_method: incomeForm.payment_method,
        note: incomeForm.note || null,
      });
    } else {
      await createIncome.mutateAsync({
        amount,
        client_id: incomeForm.client_id || null,
        payment_method: incomeForm.payment_method,
        note: incomeForm.note || null,
        received_at: new Date().toISOString(),
      });
    }
    setShowIncome(false);
    setEditIncome(null);
  };

  const handleSaveExpense = async () => {
    const amount = parseMoney(expenseForm.amount);
    if (!amount || amount <= 0) { toast.error("Укажите сумму"); return; }
    if (editExpense) {
      await updateExpenseMut.mutateAsync({
        id: editExpense.id,
        amount,
        category_id: expenseForm.category_id || null,
        note: expenseForm.note || null,
      });
    } else {
      await createExpense.mutateAsync({
        amount,
        category_id: expenseForm.category_id || null,
        note: expenseForm.note || null,
        spent_at: new Date().toISOString(),
      });
    }
    setShowExpense(false);
    setEditExpense(null);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "income") deleteIncome.mutate(deleteTarget.id);
    else deleteExpense.mutate(deleteTarget.id);
    setDeleteTarget(null);
  };

  const allTransactions = [
    ...(tab !== "Расходы" ? (incomes || []).map(i => ({ raw: i as Income | Expense, id: i.id, amount: i.amount, type: "income" as const, date: i.received_at, desc: i.note || "Оплата", category: i.clients?.full_name || "Клиент", linked: !!i.appointment_id })) : []),
    ...(tab !== "Доходы" ? (expenses || []).map(e => ({ raw: e as Income | Expense, id: e.id, amount: e.amount, type: "expense" as const, date: e.spent_at, desc: e.note || "Расход", category: e.expense_categories?.name || "Другое", linked: false })) : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen">
      <PageHeader title="Финансы" subtitle="Учёт доходов и расходов" />
      <div className="px-4 space-y-3 pb-nav">
        <MonthYearPicker value={month} onChange={setMonth} />

        <div className="grid grid-cols-3 gap-2">
          <GlassCard className="text-center py-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Доходы</p>
            <p className="text-sm font-bold text-success">{formatMoney(totalIncome)}</p>
          </GlassCard>
          <GlassCard className="text-center py-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Расходы</p>
            <p className="text-sm font-bold text-destructive">{formatMoney(totalExpenses)}</p>
          </GlassCard>
          <GlassCard className="text-center py-3">
            <p className="text-[10px] text-muted-foreground mb-0.5">Прибыль</p>
            <p className="text-sm font-bold text-foreground">{formatMoney(totalIncome - totalExpenses)}</p>
          </GlassCard>
        </div>

        {/* All-time stats */}
        {allTimeStats && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PiggyBank className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Итого за всё время</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp className="w-3 h-3 text-success" />
                  <span className="text-[10px] text-muted-foreground">Заработано</span>
                </div>
                <span className="text-sm font-bold text-success">{formatMoney(allTimeStats.totalIncome)}</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-red-50/50 dark:bg-red-900/10">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown className="w-3 h-3 text-destructive" />
                  <span className="text-[10px] text-muted-foreground">Потрачено</span>
                </div>
                <span className="text-sm font-bold text-destructive">{formatMoney(allTimeStats.totalExpenses)}</span>
              </div>
              <div className="text-center p-2 rounded-xl bg-primary/5 dark:bg-primary/10">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <PiggyBank className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground">Чистая прибыль</span>
                </div>
                <span className={cn("text-sm font-bold", allTimeStats.totalProfit >= 0 ? "text-success" : "text-destructive")}>
                  {formatMoney(allTimeStats.totalProfit)}
                </span>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-2 gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={openCreateIncome}
            className="h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-semibold text-sm flex items-center justify-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> Доход
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={openCreateExpense}
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
                <GlassCard className="flex items-center gap-3 py-3" onClick={() => setDetails({ type: txn.type, data: txn.raw })}>
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                    txn.type === "income" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20")}>
                    {txn.type === "income" ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{txn.desc}</span>
                      <span className={cn("text-sm font-bold shrink-0 ml-2", txn.type === "income" ? "text-success" : "text-destructive")}>
                        {txn.type === "income" ? "+" : "-"}{formatMoney(txn.amount)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{txn.category}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(txn.date), "d MMM, HH:mm", { locale: ru })}</span>
                      {txn.linked && <span className="text-[10px] text-primary">• из записи</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (txn.type === "income") openEditIncome(txn.raw as Income);
                        else openEditExpense(txn.raw as Expense);
                      }}
                      className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center active:scale-90 transition-transform"
                      aria-label="Редактировать"
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: txn.id, type: txn.type }); }}
                      className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center active:scale-90 transition-transform"
                      aria-label="Удалить"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Income form (create / edit) */}
      <BottomSheet
        open={showIncome}
        onClose={() => { setShowIncome(false); setEditIncome(null); }}
        title={editIncome ? "Редактировать доход" : "Новый доход"}
        footer={
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveIncome}
            disabled={createIncome.isPending || updateIncomeMut.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {(createIncome.isPending || updateIncomeMut.isPending) ? "Сохранение..." : (editIncome ? "Сохранить" : "Записать доход")}
          </motion.button>
        }
      >
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Сумма (сум) *</label>
            <input
              inputMode="numeric"
              value={incomeForm.amount}
              onChange={(e) => setIncomeForm({ ...incomeForm, amount: formatMoney(parseMoney(e.target.value)) })}
              className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="350 000"
            />
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

      {/* Expense form (create / edit) */}
      <BottomSheet
        open={showExpense}
        onClose={() => { setShowExpense(false); setEditExpense(null); }}
        title={editExpense ? "Редактировать расход" : "Новый расход"}
        footer={
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSaveExpense}
            disabled={createExpense.isPending || updateExpenseMut.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {(createExpense.isPending || updateExpenseMut.isPending) ? "Сохранение..." : (editExpense ? "Сохранить" : "Записать расход")}
          </motion.button>
        }
      >
        <div className="space-y-3 pb-2">
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground mb-1 block uppercase">Сумма (сум) *</label>
            <input
              inputMode="numeric"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: formatMoney(parseMoney(e.target.value)) })}
              className="w-full h-12 px-4 rounded-2xl bg-secondary/70 text-foreground text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="150 000"
            />
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

      {/* Transaction details */}
      <BottomSheet
        open={!!details}
        onClose={() => setDetails(null)}
        title={details?.type === "income" ? "Детали дохода" : "Детали расхода"}
      >
        {details && (() => {
          const isIncome = details.type === "income";
          const inc = isIncome ? (details.data as Income) : null;
          const exp = !isIncome ? (details.data as Expense) : null;
          const date = isIncome ? inc!.received_at : exp!.spent_at;
          return (
            <div className="space-y-3 pb-2">
              <GlassCard className="text-center py-4">
                <p className="text-xs text-muted-foreground">{isIncome ? "Доход" : "Расход"}</p>
                <p className={cn("text-2xl font-bold mt-1", isIncome ? "text-success" : "text-destructive")}>
                  {isIncome ? "+" : "-"}{formatMoney(details.data.amount)} сум
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {format(new Date(date), "d MMMM yyyy, HH:mm", { locale: ru })}
                </p>
              </GlassCard>

              {isIncome && inc!.clients?.full_name && (
                <GlassCard className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Клиентка</span>
                  <span className="text-sm font-semibold text-foreground">{inc!.clients.full_name}</span>
                </GlassCard>
              )}

              {isIncome && (
                <GlassCard className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Способ оплаты</span>
                  <span className="text-sm font-semibold text-foreground capitalize">{inc!.payment_method}</span>
                </GlassCard>
              )}

              {!isIncome && (
                <GlassCard className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Категория</span>
                  <span className="text-sm font-semibold text-foreground">{exp!.expense_categories?.name || "Без категории"}</span>
                </GlassCard>
              )}

              {isIncome && inc!.appointment_id && (
                <GlassCard className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Источник</span>
                  <span className="text-xs font-semibold text-primary">Из записи в календаре</span>
                </GlassCard>
              )}

              {details.data.note && (
                <GlassCard>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3 h-3" /> Заметка
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{details.data.note}</p>
                </GlassCard>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    const cur = details;
                    setDetails(null);
                    if (cur.type === "income") openEditIncome(cur.data as Income);
                    else openEditExpense(cur.data as Expense);
                  }}
                  className="h-11 rounded-2xl bg-secondary/70 text-foreground font-semibold text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Edit className="w-4 h-4" /> Изменить
                </button>
                <button
                  onClick={() => {
                    const cur = details;
                    setDetails(null);
                    setDeleteTarget({ id: cur.data.id, type: cur.type });
                  }}
                  className="h-11 rounded-2xl bg-destructive/10 text-destructive font-semibold text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" /> Удалить
                </button>
              </div>
            </div>
          );
        })()}
      </BottomSheet>
    </div>
  );
}
