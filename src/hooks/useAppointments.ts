import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { startOfDay, endOfDay } from "date-fns";

export type Appointment = Tables<"appointments"> & {
  clients?: { full_name: string; phone: string | null } | null;
  appointment_services?: { id: string; service_id: string; price: number; services?: { name: string; duration_minutes: number } | null }[];
};

export function useAppointments(date?: Date) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["appointments", user?.id, date?.toISOString()],
    queryFn: async () => {
      let query = supabase.from("appointments").select("*, clients(full_name, phone), appointment_services(id, service_id, price, services(name, duration_minutes))").order("start_time");

      if (date) {
        query = query.gte("start_time", startOfDay(date).toISOString()).lte("start_time", endOfDay(date).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!user,
  });
}

export function useCreateAppointment() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { client_id: string | null; start_time: string; end_time: string; expected_price: number; notes?: string; service_ids: { id: string; price: number }[] }) => {
      const { service_ids, ...rest } = input;
      const { data: apt, error } = await supabase.from("appointments").insert({ ...rest, owner_id: user!.id }).select().single();
      if (error) throw error;

      if (service_ids.length > 0) {
        const { error: svcErr } = await supabase.from("appointment_services").insert(
          service_ids.map(s => ({ appointment_id: apt.id, service_id: s.id, price: s.price }))
        );
        if (svcErr) throw svcErr;
      }
      return apt;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Запись создана"); },
    onError: (e: any) => toast.error(e.message || "Ошибка"),
  });
}

export function useUpdateAppointmentStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, final_price }: { id: string; status: string; final_price?: number }) => {
      const updates: any = { status };
      if (final_price !== undefined) updates.final_price = final_price;
      const { data, error } = await supabase.from("appointments").update(updates).eq("id", id).select("*, clients(full_name, phone), appointment_services(id, service_id, price, services(name, duration_minutes))").single();
      if (error) throw error;

      // Auto-create visit + income when completed
      if (status === "completed" && data.client_id) {
        const serviceNames = data.appointment_services?.map((s: any) => s.services?.name).filter(Boolean) || [];
        const totalPrice = final_price ?? data.expected_price;

        const { data: visit } = await supabase.from("visits").insert({
          owner_id: user!.id,
          client_id: data.client_id,
          appointment_id: id,
          visit_date: new Date().toISOString(),
          services_performed: serviceNames,
          total_price: totalPrice,
          payment_received: true,
        }).select().single();

        await supabase.from("incomes").insert({
          owner_id: user!.id,
          client_id: data.client_id,
          appointment_id: id,
          visit_id: visit?.id,
          amount: totalPrice,
          received_at: new Date().toISOString(),
        });

        // Update client stats
        const { data: visits } = await supabase.from("visits").select("total_price").eq("client_id", data.client_id);
        if (visits) {
          const totalSpent = visits.reduce((s, v) => s + v.total_price, 0);
          const totalVisits = visits.length;
          const avgCheck = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;
          let loyaltyLevel: "bronze" | "silver" | "gold" | "vip" = "bronze";
          if (totalVisits >= 30) loyaltyLevel = "vip";
          else if (totalVisits >= 15) loyaltyLevel = "gold";
          else if (totalVisits >= 5) loyaltyLevel = "silver";

          const daysSince = 0;
          let lifecycle: "new" | "active" | "inactive" | "lost" | "vip" = totalVisits <= 1 ? "new" : "active";
          if (loyaltyLevel === "vip") lifecycle = "vip";

          await supabase.from("clients").update({
            total_spent: totalSpent,
            total_visits: totalVisits,
            average_check: avgCheck,
            last_visit_date: new Date().toISOString().split("T")[0],
            days_since_last_visit: daysSince,
            loyalty_level: loyaltyLevel,
            lifecycle_status: lifecycle,
          }).eq("id", data.client_id);
        }

        qc.invalidateQueries({ queryKey: ["clients"] });
        qc.invalidateQueries({ queryKey: ["visits"] });
        qc.invalidateQueries({ queryKey: ["incomes"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }

      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      const statusMap: Record<string, string> = { completed: "Визит завершён ✨", canceled: "Запись отменена", confirmed: "Запись подтверждена", no_show: "Клиентка не пришла" };
      toast.success(statusMap[vars.status] || "Статус обновлён");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("appointment_services").delete().eq("appointment_id", id);
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); toast.success("Запись удалена"); },
    onError: (e: any) => toast.error(e.message),
  });
}
