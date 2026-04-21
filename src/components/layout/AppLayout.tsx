import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import BottomNav from "./BottomNav";
import SideMenu from "./SideMenu";
import OfflineIndicator from "./OfflineIndicator";
import { useSideMenu } from "@/contexts/SideMenuContext";
import { useTimeOfDay } from "@/hooks/useTimeOfDay";

const EDGE_THRESHOLD = 24; // px from left edge to start menu gesture
const OPEN_THRESHOLD = 60; // px horizontal travel to trigger menu
const SWIPE_NAV_THRESHOLD = 80; // px horizontal travel to switch tab
const SWIPE_VERTICAL_TOLERANCE = 1.4; // dx must dominate dy

// Tabs participating in horizontal swipe navigation (matches BottomNav order)
const SWIPE_TABS = ["/", "/calendar", "/clients", "/gallery", "/timer", "/finances"];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { open, openMenu, closeMenu } = useSideMenu();
  // Sync the whole-app scene palette to the current time-of-day
  useTimeOfDay();
  const edgeRef = useRef<{ x: number; y: number; active: boolean } | null>(null);
  const swipeRef = useRef<{ x: number; y: number; active: boolean } | null>(null);

  // Edge-swipe (open menu) + content-swipe (switch tab) gestures
  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      if (open) return;
      const t = e.touches[0];
      if (!t) return;
      // Ignore gestures starting on interactive horizontal scrollers/sliders
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-no-swipe-nav]")) {
        edgeRef.current = null;
        swipeRef.current = null;
        return;
      }
      if (t.clientX <= EDGE_THRESHOLD) {
        edgeRef.current = { x: t.clientX, y: t.clientY, active: true };
        swipeRef.current = null;
      } else {
        edgeRef.current = null;
        swipeRef.current = { x: t.clientX, y: t.clientY, active: true };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;

      const edge = edgeRef.current;
      if (edge?.active) {
        const dx = t.clientX - edge.x;
        const dy = Math.abs(t.clientY - edge.y);
        if (dx > OPEN_THRESHOLD && dx > dy * SWIPE_VERTICAL_TOLERANCE) {
          edge.active = false;
          openMenu();
        }
        return;
      }

      const sw = swipeRef.current;
      if (sw?.active) {
        const dx = t.clientX - sw.x;
        const dy = Math.abs(t.clientY - sw.y);
        if (Math.abs(dx) > SWIPE_NAV_THRESHOLD && Math.abs(dx) > dy * SWIPE_VERTICAL_TOLERANCE) {
          sw.active = false;
          const idx = SWIPE_TABS.indexOf(location.pathname);
          if (idx === -1) return;
          const nextIdx = dx < 0 ? idx + 1 : idx - 1;
          if (nextIdx >= 0 && nextIdx < SWIPE_TABS.length) {
            navigate(SWIPE_TABS[nextIdx]);
          }
        }
      }
    };
    const onTouchEnd = () => {
      edgeRef.current = null;
      swipeRef.current = null;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [open, openMenu, navigate, location.pathname]);

  return (
    <div className="min-h-screen max-w-lg mx-auto relative">
      <main key={location.pathname} className="pb-nav page-enter">
        <Outlet />
      </main>
      <BottomNav />
      <OfflineIndicator />
      <SideMenu open={open} onClose={closeMenu} />
    </div>
  );
}
