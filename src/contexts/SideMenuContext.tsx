import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface SideMenuContextValue {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
}

const SideMenuContext = createContext<SideMenuContextValue | undefined>(undefined);

export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);
  return (
    <SideMenuContext.Provider value={{ open, openMenu, closeMenu, toggleMenu }}>
      {children}
    </SideMenuContext.Provider>
  );
}

export function useSideMenu() {
  const ctx = useContext(SideMenuContext);
  if (!ctx) throw new Error("useSideMenu must be used within SideMenuProvider");
  return ctx;
}
