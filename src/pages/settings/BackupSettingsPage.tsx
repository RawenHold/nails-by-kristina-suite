import PageHeader from "@/components/layout/PageHeader";
import BackupCard from "@/components/settings/BackupCard";

export default function BackupSettingsPage() {
  return (
    <div>
      <PageHeader title="Резервная копия" showBack hideSettings />
      <div className="px-4 space-y-4 pb-nav">
        <BackupCard />
      </div>
    </div>
  );
}
