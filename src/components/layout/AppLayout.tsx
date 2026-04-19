import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen max-w-lg mx-auto relative">
      <main key={location.pathname} className="pb-nav page-enter">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
