import { cn } from "@/lib/utils";

interface ChipGroupProps {
  options: string[];
  selected: string;
  onChange: (val: string) => void;
  size?: "sm" | "md";
}

export default function ChipGroup({ options, selected, onChange, size = "sm" }: ChipGroupProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "shrink-0 rounded-full font-medium transition-all duration-200",
            size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
            selected === opt
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/80 text-muted-foreground active:bg-secondary"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
