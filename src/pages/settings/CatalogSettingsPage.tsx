import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ChipGroup from "@/components/ui/ChipGroup";
import ServicesSettingsPage from "./ServicesSettingsPage";
import CategoriesSettingsPage from "./CategoriesSettingsPage";

/**
 * Combined Каталог page — hosts both Услуги and Категории расходов
 * behind a chip switcher so the Settings list stays shorter.
 */
export default function CatalogSettingsPage() {
  const [tab, setTab] = useState("Услуги");

  return (
    <div>
      <PageHeader title="Услуги и категории" showBack hideSettings />
      <div className="px-4 pb-2">
        <ChipGroup options={["Услуги", "Категории расходов"]} selected={tab} onChange={setTab} />
      </div>
      {tab === "Услуги" ? <EmbeddedServices /> : <EmbeddedCategories />}
    </div>
  );
}

/** Wrap inner pages without their own headers. */
function EmbeddedServices() {
  return (
    <div className="-mt-2">
      <HideHeader>
        <ServicesSettingsPage />
      </HideHeader>
    </div>
  );
}
function EmbeddedCategories() {
  return (
    <div className="-mt-2">
      <HideHeader>
        <CategoriesSettingsPage />
      </HideHeader>
    </div>
  );
}

/** Hide the first <PageHeader> rendered by an embedded page. */
function HideHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="[&>div>header:first-child]:hidden [&>div>div:first-child]:!pt-0">
      {children}
    </div>
  );
}
