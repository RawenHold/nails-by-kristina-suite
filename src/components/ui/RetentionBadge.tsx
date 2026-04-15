import { cn } from "@/lib/utils";

const config = {
  new: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "New" },
  active: { bg: "bg-success/10", text: "text-success", label: "Active" },
  inactive: { bg: "bg-warning/10", text: "text-warning", label: "Inactive" },
  lost: { bg: "bg-destructive/10", text: "text-destructive", label: "Lost" },
  vip: { bg: "bg-primary/10", text: "text-primary", label: "VIP" },
};

export default function RetentionBadge({ status }: { status: keyof typeof config }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", c.bg, c.text)}>
      {c.label}
    </span>
  );
}
