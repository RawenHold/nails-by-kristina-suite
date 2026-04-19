import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex justify-center">
      <div className="relative w-full max-w-[480px] min-h-screen shadow-[0_0_60px_rgba(0,0,0,0.08)]">
        <main key={location.pathname} className="pb-nav page-enter">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
