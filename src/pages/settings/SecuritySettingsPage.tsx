import PageHeader from "@/components/layout/PageHeader";
import ChangePasswordCard from "@/components/settings/ChangePasswordCard";

export default function SecuritySettingsPage() {
  return (
    <div>
      <PageHeader title="Безопасность" showBack hideSettings />
      <div className="px-4 space-y-4 pb-nav">
        <ChangePasswordCard />
      </div>
    </div>
  );
}
