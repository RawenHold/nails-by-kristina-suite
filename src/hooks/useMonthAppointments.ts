import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * Fetches all appointment start_times within the visible month (lightweight, only dates).
 * Used to show dot markers on the calendar.
 */
export function useMonthAppointments(monthAnchor: Date) {
  const { user } = useAuth();
  const monthKey = `${monthAnchor.getFullYear()}-${monthAnchor.getMonth()}`;

  return useQuery({
    queryKey: ["appointments-month", user?.id, monthKey],
    queryFn: async () => {
      const from = startOfMonth(monthAnchor).toISOString();
      const to = endOfMonth(monthAnchor).toISOString();
      const { data, error } = await supabase
        .from("appointments")
        .select("start_time, status")
        .gte("start_time", from)
        .lte("start_time", to);
      if (error) throw error;

      // Map: "YYYY-MM-DD" -> { count, hasCompleted, hasActive }
      const map = new Map<string, { count: number; hasCompleted: boolean; hasActive: boolean }>();
      for (const row of data ?? []) {
        const d = new Date(row.start_time);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const cur = map.get(key) ?? { count: 0, hasCompleted: false, hasActive: false };
        cur.count += 1;
        if (row.status === "completed") cur.hasCompleted = true;
        else if (row.status !== "canceled" && row.status !== "no_show") cur.hasActive = true;
        map.set(key, cur);
      }
      return map;
    },
    enabled: !!user,
  });
}
