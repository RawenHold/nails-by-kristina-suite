import PageHeader from "@/components/layout/PageHeader";
import MasterProfileCard from "@/components/settings/MasterProfileCard";

export default function ProfileSettingsPage() {
  return (
    <div>
      <PageHeader title="Профиль мастера" showBack hideSettings />
      <div className="px-4 space-y-4 pb-nav">
        <MasterProfileCard />
      </div>
    </div>
  );
}
