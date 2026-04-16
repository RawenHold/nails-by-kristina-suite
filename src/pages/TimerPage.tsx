import { useState, useEffect, useRef } from "react";
import PageHeader from "@/components/layout/PageHeader";
import GlassCard from "@/components/ui/GlassCard";
import EmptyState from "@/components/ui/EmptyState";
import { Timer, Play, Pause, Square, RotateCcw, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useTimerSessions, useSaveTimerSession } from "@/hooks/useTimerSessions";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

type TimerState = "idle" | "running" | "paused";

export default function TimerPage() {
  const [state, setState] = useState<TimerState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [clientId, setClientId] = useState("");
  const [note, setNote] = useState("");
  const startedAtRef = useRef<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: clients } = useClients();
  const { data: sessions } = useTimerSessions();
  const saveSession = useSaveTimerSession();

  useEffect(() => {
    if (state === "running") {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    startedAtRef.current = new Date().toISOString();
    setState("running");
  };
  const handlePause = () => setState("paused");
  const handleResume = () => setState("running");
  const handleReset = () => { setState("idle"); setElapsed(0); };
  const handleStop = async () => {
    setState("idle");
    if (elapsed > 0) {
      await saveSession.mutateAsync({
        client_id: clientId || null,
        started_at: startedAtRef.current,
        ended_at: new Date().toISOString(),
        duration_seconds: elapsed,
        note: note || undefined,
      });
    }
    setElapsed(0);
    setNote("");
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h > 0) return `${h}ч ${m}мин`;
    return `${m}мин`;
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Таймер" subtitle="Отслеживание времени" />
      <div className="px-4 space-y-4 pb-4">
        {/* Timer Display */}
        <GlassCard elevated className="text-center py-8">
          <motion.div animate={{ scale: state === "running" ? [1, 1.02, 1] : 1 }} transition={{ repeat: state === "running" ? Infinity : 0, duration: 2 }}>
            <div className="w-48 h-48 rounded-full glass-card-elevated flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl font-mono font-bold text-foreground tracking-wider">{formatTime(elapsed)}</span>
            </div>
          </motion.div>

          <div className="flex justify-center gap-4">
            {state === "idle" && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleStart}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                <Play className="w-6 h-6 ml-0.5" />
              </motion.button>
            )}
            {state === "running" && (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handlePause}
                  className="w-14 h-14 rounded-full bg-warning text-warning-foreground flex items-center justify-center shadow-lg">
                  <Pause className="w-6 h-6" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleStop}
                  className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg">
                  <Square className="w-5 h-5" />
                </motion.button>
              </>
            )}
            {state === "paused" && (
              <>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleResume}
                  className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30">
                  <Play className="w-6 h-6 ml-0.5" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleStop}
                  className="w-14 h-14 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg">
                  <Square className="w-5 h-5" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleReset}
                  className="w-14 h-14 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </motion.button>
              </>
            )}
          </div>
        </GlassCard>

        {/* Link to client */}
        <GlassCard>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">Клиентка</label>
          <select value={clientId} onChange={(e) => setClientId(e.target.value)}
            className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">Без привязки</option>
            {clients?.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
          </select>
          <label className="text-[11px] font-semibold text-muted-foreground mb-1.5 mt-3 block uppercase tracking-wide">Заметка</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Что делали..."
            className="w-full h-11 px-4 rounded-2xl bg-secondary/70 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </GlassCard>

        {/* Session History */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-2">История сессий</h2>
          {!sessions?.length ? (
            <EmptyState icon={Clock} title="Нет сессий" description="Запустите таймер для отслеживания" />
          ) : (
            <div className="space-y-1.5">
              {sessions.map((s: any) => (
                <GlassCard key={s.id} className="flex items-center gap-3 py-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Timer className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{s.clients?.full_name || "Без клиентки"}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">{formatDuration(s.duration_seconds)}</span>
                      <span className="text-[11px] text-muted-foreground">•</span>
                      <span className="text-[11px] text-muted-foreground">{format(new Date(s.started_at), "d MMM, HH:mm", { locale: ru })}</span>
                    </div>
                    {s.note && <p className="text-[10px] text-muted-foreground truncate">{s.note}</p>}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
