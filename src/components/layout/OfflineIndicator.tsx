import { motion, AnimatePresence } from "framer-motion";
import { CloudOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { flushQueue } from "@/lib/offline/queue";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Tiny status pill shown when offline OR while there are queued mutations.
 * Sits above the bottom nav.
 */
export default function OfflineIndicator() {
  const { online, pending } = useOnlineStatus();
  const qc = useQueryClient();
  const [justSynced, setJustSynced] = useState(false);

  // When we come back online and queue empties, flash a "synced" toast briefly
  useEffect(() => {
    let cancelled = false;
    if (online && pending > 0) {
      flushQueue().then((r) => {
        if (cancelled) return;
        if (r.ok > 0) {
          qc.invalidateQueries();
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 2500);
        }
      });
    }
  }, [online, pending, qc]);

  const visible = !online || pending > 0 || justSynced;
  if (!visible) return null;

  const isOffline = !online;
  const isSyncing = online && pending > 0;

  return (
    <AnimatePresence>
      <motion.div
        key={isOffline ? "off" : isSyncing ? "sync" : "ok"}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        style={{ bottom: "calc(var(--nav-h, 72px) + env(safe-area-inset-bottom) + 8px)" }}
      >
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl text-[11px] font-medium shadow-lg border ${
            isOffline
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
              : isSyncing
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
          }`}
        >
          {isOffline ? (
            <>
              <CloudOff className="w-3 h-3" />
              <span>Офлайн{pending > 0 ? ` · ${pending} в очереди` : ""}</span>
            </>
          ) : isSyncing ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Синхронизация · {pending}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" />
              <span>Синхронизировано</span>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
