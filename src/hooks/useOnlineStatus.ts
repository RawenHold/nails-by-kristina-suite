import { useEffect, useState } from "react";
import { getPendingCount, subscribeQueue } from "@/lib/offline/queue";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const onUp = () => setOnline(true);
    const onDown = () => setOnline(false);
    window.addEventListener("online", onUp);
    window.addEventListener("offline", onDown);
    return () => {
      window.removeEventListener("online", onUp);
      window.removeEventListener("offline", onDown);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      const n = await getPendingCount();
      if (mounted) setPending(n);
    };
    refresh();
    const unsub = subscribeQueue(refresh);
    const t = setInterval(refresh, 5000);
    return () => {
      mounted = false;
      unsub();
      clearInterval(t);
    };
  }, []);

  return { online, pending };
}
