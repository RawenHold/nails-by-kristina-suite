import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { installAutoFlush } from "@/lib/offline/queue";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SideMenuProvider } from "@/contexts/SideMenuContext";
import AppLayout from "@/components/layout/AppLayout";
import AuthPage from "@/pages/AuthPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import HomePage from "@/pages/HomePage";
import CalendarPage from "@/pages/CalendarPage";
import ClientsPage from "@/pages/ClientsPage";
import ClientProfilePage from "@/pages/ClientProfilePage";
import GalleryPage from "@/pages/GalleryPage";
import TimerPage from "@/pages/TimerPage";
import FinancesPage from "@/pages/FinancesPage";
import SettingsPage from "@/pages/SettingsPage";
import ProfileSettingsPage from "@/pages/settings/ProfileSettingsPage";
import AppearanceSettingsPage from "@/pages/settings/AppearanceSettingsPage";
import ServicesSettingsPage from "@/pages/settings/ServicesSettingsPage";
import CategoriesSettingsPage from "@/pages/settings/CategoriesSettingsPage";
import CatalogSettingsPage from "@/pages/settings/CatalogSettingsPage";
import BackupSettingsPage from "@/pages/settings/BackupSettingsPage";
import SecuritySettingsPage from "@/pages/settings/SecuritySettingsPage";
import NotFound from "./pages/NotFound";
import { motion } from "framer-motion";
import logo from "@/assets/logo.svg";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh-enough offline; React Query will refetch on reconnect
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days — needed for persister
      staleTime: 1000 * 30,
      retry: (failureCount, err: any) => {
        // Don't hammer if offline
        if (typeof navigator !== "undefined" && !navigator.onLine) return false;
        return failureCount < 2;
      },
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

// Safe persister: in private/incognito modes localStorage access can throw.
// Fall back to undefined so the app still mounts.
const persister = (() => {
  if (typeof window === "undefined") return undefined;
  try {
    const testKey = "__knails_ls_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return createSyncStoragePersister({ storage: window.localStorage, key: "knails-rq-cache" });
  } catch {
    return undefined;
  }
})();

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
        <img src={logo} alt="K Nails Finance" className="w-16 h-16 drop-shadow-lg" />
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
      </motion.div>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      {user ? (
        <>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/clients/:id" element={<ClientProfilePage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/finances" element={<FinancesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
            <Route path="/settings/catalog" element={<CatalogSettingsPage />} />
            <Route path="/settings/services" element={<ServicesSettingsPage />} />
            <Route path="/settings/categories" element={<CategoriesSettingsPage />} />
            <Route path="/settings/backup" element={<BackupSettingsPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </>
      ) : (
        <Route path="*" element={<AuthPage />} />
      )}
    </Routes>
  );
}

function AutoFlushBoot() {
  useEffect(() => {
    installAutoFlush(() => queryClient.invalidateQueries());
  }, []);
  return null;
}

const AppShell = ({ children }: { children: React.ReactNode }) =>
  persister ? (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7, buster: "v1" }}
    >
      {children}
    </PersistQueryClientProvider>
  ) : (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

const App = () => (
  <AppShell>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <SideMenuProvider>
            <AutoFlushBoot />
            <AppRoutes />
          </SideMenuProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </AppShell>
);

export default App;
