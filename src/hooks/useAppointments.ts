import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { startOfDay, endOfDay } from "date-fns";
import { enqueueMutation } from "@/lib/offline/queue";

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

      // Offline path: pre-generate UUID, optimistically push to cache, queue server writes.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const newId = crypto.randomUUID();
        const aptRow: any = { id: newId, ...rest, owner_id: user!.id, status: "planned", final_price: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        await enqueueMutation({ table: "appointments", op: "insert", payload: aptRow });
        if (service_ids.length > 0) {
          const svcRows: any = service_ids.map(s => ({ id: crypto.randomUUID(), appointment_id: newId, service_id: s.id, price: s.price }));
          await enqueueMutation({ table: "appointment_services", op: "insert", payload: svcRows });
        }
        return aptRow;
      }

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      toast.success(offline ? "Запись сохранена офлайн — отправится при сети" : "Запись создана");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });
}

/**
 * Update an appointment. If `payment` is supplied AND the appointment is/becomes "completed",
 * the linked income + visit are re-synced (no duplicates) so finances stay consistent.
 */
export function useUpdateAppointment() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      service_ids,
      payment,
      ...updates
    }: {
      id: string;
      service_ids?: { id: string; price: number }[];
      payment?: { paid_amount: number; payment_method: "cash" | "card" | "transfer" | "other"; note?: string };
    } & TablesUpdate<"appointments">) => {
      // If payment provided, force final_price to match
      if (payment) {
        updates.final_price = payment.paid_amount;
      }
      const { data, error } = await supabase.from("appointments").update(updates).eq("id", id).select("*, clients(full_name), appointment_services(id, price, services(name))").single();
      if (error) throw error;

      if (service_ids) {
        await supabase.from("appointment_services").delete().eq("appointment_id", id);
        if (service_ids.length > 0) {
          await supabase.from("appointment_services").insert(
            service_ids.map(s => ({ appointment_id: id, service_id: s.id, price: s.price }))
          );
        }
      }

      // Re-sync linked income / visit if appointment is completed
      const isCompleted = (updates.status ?? data.status) === "completed";
      if (payment && isCompleted && data.client_id) {
        // Reverse any existing visit/income for this appointment
        const { data: existingVisits } = await supabase.from("visits").select("id").eq("appointment_id", id);
        if (existingVisits?.length) {
          const ids = existingVisits.map(v => v.id);
          await supabase.from("visit_photos").delete().in("visit_id", ids);
          await supabase.from("visits").delete().in("id", ids);
        }
        await supabase.from("incomes").delete().eq("appointment_id", id);

        const serviceNames = data.appointment_services?.map((s: { services?: { name?: string } }) => s.services?.name).filter(Boolean) as string[];

        const { data: visit, error: visitErr } = await supabase.from("visits").insert({
          owner_id: user!.id,
          client_id: data.client_id,
          appointment_id: id,
          visit_date: new Date().toISOString(),
          services_performed: serviceNames,
          total_price: payment.paid_amount,
          payment_method: payment.payment_method,
          payment_received: true,
        }).select().single();
        if (visitErr) throw visitErr;

        const { error: incomeErr } = await supabase.from("incomes").insert({
          owner_id: user!.id,
          client_id: data.client_id,
          appointment_id: id,
          visit_id: visit.id,
          amount: payment.paid_amount,
          payment_method: payment.payment_method,
          note: payment.note || null,
          received_at: new Date().toISOString(),
        });
        if (incomeErr) throw incomeErr;

        await recalculateClientStats(data.client_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Запись обновлена");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

async function recalculateClientStats(clientId: string) {
  const { data: visits } = await supabase.from("visits").select("total_price, visit_date").eq("client_id", clientId);
  if (!visits) return;
  const totalSpent = visits.reduce((s, v) => s + v.total_price, 0);
  const totalVisits = visits.length;
  const avgCheck = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;
  const lastVisit = visits.map(v => v.visit_date).sort().reverse()[0] || null;
  const daysSince = lastVisit
    ? Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86_400_000)
    : null;

  let loyaltyLevel: "bronze" | "silver" | "gold" | "vip" = "bronze";
  if (totalVisits >= 30) loyaltyLevel = "vip";
  else if (totalVisits >= 15) loyaltyLevel = "gold";
  else if (totalVisits >= 5) loyaltyLevel = "silver";

  let lifecycle: "new" | "active" | "inactive" | "lost" | "vip" = "new";
  if (loyaltyLevel === "vip") lifecycle = "vip";
  else if (totalVisits === 0) lifecycle = "new";
  else if (daysSince !== null && daysSince > 60) lifecycle = "lost";
  else if (daysSince !== null && daysSince > 21) lifecycle = "inactive";
  else lifecycle = totalVisits <= 1 ? "new" : "active";

  await supabase.from("clients").update({
    total_spent: totalSpent,
    total_visits: totalVisits,
    average_check: avgCheck,
    last_visit_date: lastVisit ? lastVisit.split("T")[0] : null,
    days_since_last_visit: daysSince,
    loyalty_level: loyaltyLevel,
    lifecycle_status: lifecycle,
  }).eq("id", clientId);
}

/**
 * Complete an appointment with explicit payment data, creating linked visit + income.
 * Idempotent: removes any prior visit/income tied to this appointment first.
 */
export function useCompleteAppointment() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      appointment_id: string;
      paid_amount: number;
      payment_method: "cash" | "card" | "transfer" | "other";
      note?: string;
    }) => {
      const { data: apt, error: aptErr } = await supabase
        .from("appointments")
        .select("*, clients(full_name), appointment_services(id, price, services(name))")
        .eq("id", input.appointment_id)
        .single();
      if (aptErr) throw aptErr;
      if (!apt.client_id) throw new Error("У записи не указана клиентка");

      // Reverse any previously generated visit/income for this appointment (idempotency)
      const { data: existingVisits } = await supabase.from("visits").select("id").eq("appointment_id", input.appointment_id);
      if (existingVisits?.length) {
        const ids = existingVisits.map(v => v.id);
        await supabase.from("visit_photos").delete().in("visit_id", ids);
        await supabase.from("visits").delete().in("id", ids);
      }
      await supabase.from("incomes").delete().eq("appointment_id", input.appointment_id);

      const serviceNames = apt.appointment_services?.map((s: { services?: { name?: string } }) => s.services?.name).filter(Boolean) as string[];

      // Update appointment as completed (and persist payment note into appointment notes so it stays visible)
      const mergedNotes = input.note
        ? (apt.notes ? `${apt.notes}\n💰 ${input.note}` : `💰 ${input.note}`)
        : apt.notes;
      const { error: updErr } = await supabase
        .from("appointments")
        .update({ status: "completed", final_price: input.paid_amount, notes: mergedNotes })
        .eq("id", input.appointment_id);
      if (updErr) throw updErr;

      // Create visit
      const { data: visit, error: visitErr } = await supabase.from("visits").insert({
        owner_id: user!.id,
        client_id: apt.client_id,
        appointment_id: input.appointment_id,
        visit_date: new Date().toISOString(),
        services_performed: serviceNames,
        total_price: input.paid_amount,
        payment_method: input.payment_method,
        payment_received: true,
      }).select().single();
      if (visitErr) throw visitErr;

      // Create income
      const { error: incomeErr } = await supabase.from("incomes").insert({
        owner_id: user!.id,
        client_id: apt.client_id,
        appointment_id: input.appointment_id,
        visit_id: visit.id,
        amount: input.paid_amount,
        payment_method: input.payment_method,
        note: input.note || null,
        received_at: new Date().toISOString(),
      });
      if (incomeErr) throw incomeErr;

      await recalculateClientStats(apt.client_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["client"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Визит завершён ✨");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "planned" | "confirmed" | "canceled" | "no_show" }) => {
      const { data: apt } = await supabase.from("appointments").select("client_id, status").eq("id", id).single();

      // If moving away from completed, reverse income/visit
      if (apt?.status === "completed") {
        const { data: existingVisits } = await supabase.from("visits").select("id").eq("appointment_id", id);
        if (existingVisits?.length) {
          const ids = existingVisits.map(v => v.id);
          await supabase.from("visit_photos").delete().in("visit_id", ids);
          await supabase.from("visits").delete().in("id", ids);
        }
        await supabase.from("incomes").delete().eq("appointment_id", id);
        if (apt.client_id) await recalculateClientStats(apt.client_id);
      }

      const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Capture client to recalc later
      const { data: apt } = await supabase.from("appointments").select("client_id").eq("id", id).single();

      // Cascade clean: visits, incomes, timer link
      const { data: visits } = await supabase.from("visits").select("id").eq("appointment_id", id);
      if (visits?.length) {
        const ids = visits.map(v => v.id);
        await supabase.from("visit_photos").delete().in("visit_id", ids);
        await supabase.from("visits").delete().in("id", ids);
      }
      await supabase.from("incomes").delete().eq("appointment_id", id);
      await supabase.from("timer_sessions").update({ appointment_id: null }).eq("appointment_id", id);
      await supabase.from("appointment_services").delete().eq("appointment_id", id);

      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;

      if (apt?.client_id) await recalculateClientStats(apt.client_id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["incomes"] });
      qc.invalidateQueries({ queryKey: ["visits"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Запись удалена");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
