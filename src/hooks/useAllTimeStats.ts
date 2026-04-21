import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAllTimeStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["allTimeStats", user?.id],
    queryFn: async () => {
      const [incomesRes, expensesRes] = await Promise.all([
        supabase.from("incomes").select("amount"),
        supabase.from("expenses").select("amount"),
      ]);

      const totalIncome = (incomesRes.data || []).reduce((acc, i) => acc + i.amount, 0);
      const totalExpenses = (expensesRes.data || []).reduce((acc, e) => acc + e.amount, 0);

      return {
        totalIncome,
        totalExpenses,
        totalProfit: totalIncome - totalExpenses,
      };
    },
    enabled: !!user,
  });
}
