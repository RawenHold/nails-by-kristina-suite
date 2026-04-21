import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import BottomNav from "./BottomNav";
import SideMenu from "./SideMenu";
import { useSideMenu } from "@/contexts/SideMenuContext";

const EDGE_THRESHOLD = 24; // px from left edge to start gesture
const OPEN_THRESHOLD = 60; // px horizontal travel to trigger open

export default function AppLayout() {
  const location = useLocation();
  const { open, openMenu, closeMenu } = useSideMenu();
  const startRef = useRef<{ x: number; y: number; active: boolean } | null>(null);

  // Edge-swipe gesture: swipe from left edge to open menu
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (open) return;
      const t = e.touches[0];
      if (!t) return;
      if (t.clientX <= EDGE_THRESHOLD) {
        startRef.current = { x: t.clientX, y: t.clientY, active: true };
      } else {
        startRef.current = null;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const s = startRef.current;
      if (!s || !s.active) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - s.x;
      const dy = Math.abs(t.clientY - s.y);
      if (dx > OPEN_THRESHOLD && dx > dy * 1.4) {
        s.active = false;
        openMenu();
      }
    };
    const onTouchEnd = () => {
      startRef.current = null;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [open, openMenu]);

  return (
    <div className="min-h-screen max-w-lg mx-auto relative">
      <main key={location.pathname} className="pb-nav page-enter">
        <Outlet />
      </main>
      <BottomNav />
      <SideMenu open={open} onClose={closeMenu} />
    </div>
  );
}
