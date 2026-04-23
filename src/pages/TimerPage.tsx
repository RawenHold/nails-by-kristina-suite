import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import BottomSheet from "@/components/ui/BottomSheet";
import StopwatchDial from "@/components/timer/StopwatchDial";
import { Timer, Clock, Trash2, CheckSquare, Square as SquareIcon, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useTimerSessions, useSaveTimerSession, useDeleteTimerSessions, useUpdateTimerSession } from "@/hooks/useTimerSessions";
import { useImeSafeInput } from "@/hooks/useImeSafeInput";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type TimerState = "idle" | "running" | "paused";
const TIMER_STORAGE_KEY = "knails-timer-draft";

export default function TimerPage() {
  const [state, setState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [clientId, setClientId] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmTarget, setConfirmTarget] = useState<"selected" | "all" | string | null>(null);
  const note = useImeSafeInput<HTMLInputElement>("");
  const startedAtRef = useRef<string>("");
  const runStartedAtMsRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: clients } = useClients();
  const { data: sessions } = useTimerSessions();
  const saveSession = useSaveTimerSession();
  const deleteSessions = useDeleteTimerSessions();

  const persistTimer = () => {
    const payload = {
      state,
      elapsed,
      clientId,
      note: note.read(),
      startedAt: startedAtRef.current,
      runStartedAtMs: runStartedAtMsRef.current,
      pausedElapsed: pausedElapsedRef.current,
    };
    if (payload.state === "idle" && !payload.elapsed && !payload.clientId && !payload.note) {
      localStorage.removeItem(TIMER_STORAGE_KEY);
      return;
    }
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(payload));
  };

  useEffect(() => {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      startedAtRef.current = saved.startedAt ?? "";
      runStartedAtMsRef.current = saved.runStartedAtMs ?? null;
      pausedElapsedRef.current = saved.pausedElapsed ?? saved.elapsed ?? 0;
      setClientId(saved.clientId ?? "");
      note.reset(saved.note ?? "");
      if (saved.state === "running" && saved.runStartedAtMs) {
        setElapsed(pausedElapsedRef.current + Math.max(0, Math.floor((Date.now() - saved.runStartedAtMs) / 1000)));
        setState("running");
      } else {
        setElapsed(saved.elapsed ?? pausedElapsedRef.current ?? 0);
        setState(saved.state ?? "idle");
      }
    } catch {
      localStorage.removeItem(TIMER_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (state === "running") {
      const tick = () => {
        const runStartedAt = runStartedAtMsRef.current ?? Date.now();
        setElapsed(pausedElapsedRef.current + Math.max(0, Math.floor((Date.now() - runStartedAt) / 1000)));
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state]);

  useEffect(() => { persistTimer(); }, [state, elapsed, clientId]);

  useEffect(() => {
    const sync = () => {
      if (document.visibilityState === "visible" && state === "running" && runStartedAtMsRef.current) {
        setElapsed(pausedElapsedRef.current + Math.max(0, Math.floor((Date.now() - runStartedAtMsRef.current) / 1000)));
      }
      persistTimer();
    };
    window.addEventListener("beforeunload", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("beforeunload", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [state, elapsed, clientId]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    const now = new Date();
    startedAtRef.current = now.toISOString();
    runStartedAtMsRef.current = now.getTime();
    pausedElapsedRef.current = 0;
    setElapsed(0);
    setState("running");
  };
  const handlePause = () => {
    if (runStartedAtMsRef.current) {
      const nextElapsed = pausedElapsedRef.current + Math.max(0, Math.floor((Date.now() - runStartedAtMsRef.current) / 1000));
      pausedElapsedRef.current = nextElapsed;
      runStartedAtMsRef.current = null;
      setElapsed(nextElapsed);
    }
    setState("paused");
  };
  const handleResume = () => {
    runStartedAtMsRef.current = Date.now();
    setState("running");
  };
  const handleReset = () => {
    setState("idle");
    setElapsed(0);
    setClientId("");
    startedAtRef.current = "";
    runStartedAtMsRef.current = null;
    pausedElapsedRef.current = 0;
    note.reset("");
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };
  const handleStop = async () => {
    const finalElapsed = runStartedAtMsRef.current
      ? pausedElapsedRef.current + Math.max(0, Math.floor((Date.now() - runStartedAtMsRef.current) / 1000))
      : elapsed;
    setState("idle");
    if (finalElapsed > 0) {
      await saveSession.mutateAsync({
        client_id: clientId || null,
        started_at: startedAtRef.current,
        ended_at: new Date().toISOString(),
        duration_seconds: finalElapsed,
        note: note.read() || undefined,
      });
    }
    setElapsed(0);
    setClientId("");
    startedAtRef.current = "";
    runStartedAtMsRef.current = null;
    pausedElapsedRef.current = 0;
    note.reset("");
    localStorage.removeItem(TIMER_STORAGE_KEY);
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}ч ${m}мин`;
    return `${m}мин`;
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()); };

  const handleConfirmDelete = () => {
    if (!confirmTarget) return;
    if (confirmTarget === "all") {
      deleteSessions.mutate("all");
    } else if (confirmTarget === "selected") {
      deleteSessions.mutate(Array.from(selected));
      exitSelectMode();
    } else {
      deleteSessions.mutate([confirmTarget]);
    }
    setConfirmTarget(null);
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Таймер" subtitle="Отслеживание времени" />
      <div className="px-4 space-y-4 pb-nav">
        {/* iOS-style stopwatch */}
        <div className="rounded-3xl bg-gradient-to-b from-secondary/40 to-secondary/10 p-5 pt-7 pb-6">
          <div className="relative w-[78vw] max-w-[340px] aspect-square mx-auto">
            <StopwatchDial elapsed={elapsed} running={state === "running"} />
            {/* Centered digital readout */}
            <div className="absolute inset-x-0 top-[58%] flex justify-center pointer-events-none">
              <span className="font-mono text-[clamp(1.1rem,4.6vw,1.5rem)] font-medium text-foreground tracking-wider tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>

          {/* iOS dual circular buttons */}
          <div className="flex items-center justify-between mt-7 px-2">
            {/* Left: Reset (idle when running, otherwise reset/disabled) */}
            {state === "running" ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handlePause}
                className="w-[68px] h-[68px] rounded-full bg-secondary/70 text-foreground text-sm font-medium ring-1 ring-glass-border active:bg-secondary"
              >
                Пауза
              </motion.button>
            ) : state === "paused" ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleReset}
                className="w-[68px] h-[68px] rounded-full bg-secondary/70 text-foreground text-sm font-medium ring-1 ring-glass-border active:bg-secondary"
              >
                Сброс
              </motion.button>
            ) : (
              <div className="w-[68px] h-[68px] rounded-full bg-secondary/30 text-muted-foreground/50 text-sm font-medium flex items-center justify-center select-none">
                Сброс
              </div>
            )}

            {/* Right: Start / Stop */}
            {state === "running" ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleStop}
                className="w-[68px] h-[68px] rounded-full text-destructive text-sm font-semibold ring-1 ring-destructive/30 bg-destructive/15 active:bg-destructive/25"
              >
                Стоп
              </motion.button>
            ) : state === "paused" ? (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleResume}
                className="w-[68px] h-[68px] rounded-full text-success text-sm font-semibold ring-1 ring-success/30 bg-success/15 active:bg-success/25"
              >
                Старт
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleStart}
                className="w-[68px] h-[68px] rounded-full text-success text-base font-semibold ring-1 ring-success/30 bg-success/15 active:bg-success/25"
              >
                Старт
              </motion.button>
            )}
          </div>
        </div>

        {/* Link to client */}
        <GlassCard>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Клиентка</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Без привязки</option>
            {clients?.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 mt-3 block uppercase tracking-wide">Заметка</label>
          <input
            ref={note.ref}
            defaultValue={note.initial}
            onInput={note.onInput}
            onCompositionEnd={note.onCompositionEnd}
            lang="ru"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck={false}
            placeholder="Что делали..."
            className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </GlassCard>

        {/* Session History */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground">История сессий</h2>
            {sessions && sessions.length > 0 && (
              <div className="flex items-center gap-2">
                {selectMode ? (
                  <>
                    <button
                      onClick={() => setConfirmTarget("selected")}
                      disabled={selected.size === 0}
                      className="text-[11px] font-semibold text-destructive disabled:opacity-40 active:opacity-70"
                    >
                      Удалить ({selected.size})
                    </button>
                    <button onClick={exitSelectMode} className="text-[11px] font-semibold text-muted-foreground active:opacity-70">
                      Отмена
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setSelectMode(true)} className="text-[11px] font-semibold text-primary active:opacity-70">
                      Выбрать
                    </button>
                    <button onClick={() => setConfirmTarget("all")} className="text-[11px] font-semibold text-destructive active:opacity-70">
                      Очистить
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {!sessions?.length ? (
            <EmptyState icon={Clock} title="Нет сессий" description="Запустите таймер для отслеживания" />
          ) : (
            <div className="space-y-1.5">
              {sessions.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <GlassCard
                    key={s.id}
                    onClick={selectMode ? () => toggleSelect(s.id) : undefined}
                    className={cn(
                      "flex items-center gap-3 py-3 transition-all",
                      selectMode && isSelected && "ring-2 ring-primary/40"
                    )}
                  >
                    {selectMode ? (
                      <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                        {isSelected
                          ? <CheckSquare className="w-4 h-4 text-primary" />
                          : <SquareIcon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                        <Timer className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{s.clients?.full_name || "Без клиентки"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">{formatDuration(s.duration_seconds)}</span>
                        <span className="text-[11px] text-muted-foreground">•</span>
                        <span className="text-[11px] text-muted-foreground">{format(new Date(s.started_at), "d MMM, HH:mm", { locale: ru })}</span>
                      </div>
                      {s.note && <p className="text-[10px] text-muted-foreground truncate">{s.note}</p>}
                    </div>
                    {!selectMode && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmTarget(s.id); }}
                        className="w-8 h-8 rounded-xl bg-secondary/60 flex items-center justify-center active:scale-90 transition-transform"
                        aria-label="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmTarget(null)}
        title={
          confirmTarget === "all" ? "Очистить всю историю?" :
          confirmTarget === "selected" ? "Удалить выбранные записи?" :
          "Удалить запись?"
        }
        description={
          confirmTarget === "all"
            ? "Все сессии таймера будут безвозвратно удалены. Это действие нельзя отменить."
            : "Это действие нельзя отменить."
        }
        confirmLabel={confirmTarget === "all" ? "Очистить всё" : "Удалить"}
      />
    </div>
  );
}
