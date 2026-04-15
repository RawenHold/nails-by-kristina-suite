import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import ChipGroup from "@/components/ui/ChipGroup";
import FloatingActionButton from "@/components/ui/FloatingActionButton";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Minus,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const periods = ["Today", "This Week", "This Month"];
const tabs = ["Overview", "Income", "Expenses"];

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: string;
  client?: string;
}

const mockTransactions: Transaction[] = [
  { id: "1", type: "income", amount: 350000, description: "Gel Polish + Design", category: "Service", date: "Today, 11:30", client: "Anna K." },
  { id: "2", type: "income", amount: 280000, description: "Manicure + Gel Polish", category: "Service", date: "Today, 14:00", client: "Maria S." },
  { id: "3", type: "expense", amount: 150000, description: "Gel polish set", category: "Materials", date: "Today, 09:15" },
  { id: "4", type: "income", amount: 450000, description: "Full Set + Design", category: "Service", date: "Yesterday, 16:00", client: "Elena V." },
  { id: "5", type: "expense", amount: 80000, description: "Nail files & buffers", category: "Tools", date: "Yesterday, 10:30" },
  { id: "6", type: "expense", amount: 90000, description: "Instagram promotion", category: "Advertising", date: "2 days ago" },
];

export default function FinancesPage() {
  const [period, setPeriod] = useState("This Month");
  const [tab, setTab] = useState("Overview");

  const formatCurrency = (val: number) => new Intl.NumberFormat("uz-UZ").format(val);

  const totalIncome = mockTransactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpenses = mockTransactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const filtered = mockTransactions.filter((t) => {
    if (tab === "Income") return t.type === "income";
    if (tab === "Expenses") return t.type === "expense";
    return true;
  });

  return (
    <div className="min-h-screen">
      <PageHeader title="Finances" subtitle="Track your business" />

      <div className="px-4 space-y-3 pb-4">
        <ChipGroup options={periods} selected={period} onChange={setPeriod} />

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Income" value={`${formatCurrency(totalIncome)}`} icon={TrendingUp} className="col-span-1" />
          <StatCard label="Expenses" value={`${formatCurrency(totalExpenses)}`} icon={TrendingDown} className="col-span-1" />
          <StatCard label="Profit" value={`${formatCurrency(totalIncome - totalExpenses)}`} icon={Wallet} className="col-span-1" />
        </div>

        {/* Revenue Chart Placeholder */}
        <GlassCard>
          <p className="text-xs font-medium text-muted-foreground mb-2">Revenue Trend</p>
          <div className="flex items-end gap-1 h-20">
            {[65, 45, 80, 55, 90, 70, 95].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                className={cn("flex-1 rounded-t-md", i === 6 ? "bg-primary" : "bg-primary/20")}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="text-[8px] text-muted-foreground flex-1 text-center">{d}</span>
            ))}
          </div>
        </GlassCard>

        {/* Tabs */}
        <ChipGroup options={tabs} selected={tab} onChange={setTab} />

        {/* Transactions */}
        <div className="space-y-2">
          {filtered.map((txn, i) => (
            <motion.div
              key={txn.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassCard className="flex items-center gap-3 py-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  txn.type === "income" ? "bg-success/10" : "bg-destructive/10"
                )}>
                  {txn.type === "income" ? (
                    <ArrowUpRight className="w-4 h-4 text-success" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{txn.description}</span>
                    <span className={cn(
                      "text-sm font-semibold shrink-0 ml-2",
                      txn.type === "income" ? "text-success" : "text-destructive"
                    )}>
                      {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">{txn.category}</span>
                    {txn.client && (
                      <>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-[10px] text-muted-foreground">{txn.client}</span>
                      </>
                    )}
                    <span className="text-[10px] text-muted-foreground">•</span>
                    <span className="text-[10px] text-muted-foreground">{txn.date}</span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <FloatingActionButton onClick={() => toast.info("Add transaction coming soon")} />
    </div>
  );
}
