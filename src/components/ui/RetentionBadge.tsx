import { cn } from "@/lib/utils";

const config = {
  new: { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500", label: "New" },
  active: { bg: "bg-emerald-50 dark:bg-emerald-900/20", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Active" },
  inactive: { bg: "bg-amber-50 dark:bg-amber-900/20", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", label: "Inactive" },
  lost: { bg: "bg-red-50 dark:bg-red-900/20", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Lost" },
  vip: { bg: "bg-primary/8 dark:bg-primary/15", text: "text-primary", dot: "bg-primary", label: "VIP" },
};

export default function RetentionBadge({ status }: { status: keyof typeof config }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold", c.bg, c.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
    </span>
  );
}
