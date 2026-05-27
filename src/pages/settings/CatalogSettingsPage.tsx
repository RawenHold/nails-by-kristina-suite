import { useState } from "react";
import PageHeader from "@/components/layout/PageHeader";
import ChipGroup from "@/components/ui/ChipGroup";
import ServicesSettingsPage from "./ServicesSettingsPage";
import CategoriesSettingsPage from "./CategoriesSettingsPage";

/**
 * Combined каталог: Услуги + Категории расходов под общим переключателем.
 */
export default function CatalogSettingsPage() {
  const [tab, setTab] = useState<"Услуги" | "Категории">("Услуги");

  return (
    <div>
      <PageHeader title="Услуги и категории" showBack hideSettings />
      <div className="px-4 pb-3">
        <ChipGroup
          options={["Услуги", "Категории"]}
          selected={tab}
          onChange={(v) => setTab(v as typeof tab)}
        />
      </div>
      {tab === "Услуги" ? (
        <ServicesSettingsPage embedded />
      ) : (
        <CategoriesSettingsPage embedded />
      )}
    </div>
  );
}
