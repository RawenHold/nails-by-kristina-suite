import { useEffect, useState } from "react";

export type TimeOfDay = "morning" | "day" | "evening" | "night";

function compute(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return "morning";
  if (h >= 10 && h < 17) return "day";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

/**
 * Returns the current time-of-day bucket and writes it as a `data-tod`
 * attribute on <html> so CSS can theme the entire app cheaply with
 * variables — no per-frame JS, no re-renders elsewhere.
 *
 * Re-checks every 5 minutes (cheap interval, single source of truth).
 */
export function useTimeOfDay(): TimeOfDay {
  const [tod, setTod] = useState<TimeOfDay>(() => compute());

  useEffect(() => {
    document.documentElement.setAttribute("data-tod", tod);
  }, [tod]);

  useEffect(() => {
    const tick = () => {
      const next = compute();
      setTod((prev) => (prev === next ? prev : next));
    };
    const id = window.setInterval(tick, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  return tod;
}
