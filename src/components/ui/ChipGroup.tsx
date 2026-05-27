import { GlowingButton } from "@/components/ui/GlowingButton";

interface ChipGroupProps {
  options: string[];
  selected: string;
  onChange: (val: string) => void;
  size?: "sm" | "md";
}

/**
 * Chip / segmented row built on top of GlowingButton — gives every chip on
 * the platform the consistent glowing edge-bar treatment.
 */
export default function ChipGroup({ options, selected, onChange, size = "sm" }: ChipGroupProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-0.5 px-0.5">
      {options.map((opt) => (
        <GlowingButton
          key={opt}
          size={size}
          active={selected === opt}
          onClick={() => onChange(opt)}
          className="shrink-0"
        >
          {opt}
        </GlowingButton>
      ))}
    </div>
  );
}
