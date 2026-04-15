import { cn } from "@/lib/utils";

interface ChipGroupProps {
  options: string[];
  selected: string;
  onChange: (val: string) => void;
}

export default function ChipGroup({ options, selected, onChange }: ChipGroupProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            selected === opt
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
