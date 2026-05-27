import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Glowing button — gradient surface with animated edge-light bar.
 * The glow color drives a vertical "bar" on the right edge that slides
 * across on hover/active, plus a soft horizontal gradient sheen.
 *
 * Use `active` for selected state in chip groups / segmented controls.
 */

function hexToRgba(hex: string, alpha = 1): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Resolve an `hsl(var(--primary))` style token to an actual hex/hsl color. */
function resolveColor(raw?: string): string {
  if (raw && raw.startsWith("#")) return raw;
  if (typeof window === "undefined") return raw || "#d4536a";
  const root = getComputedStyle(document.documentElement);
  if (!raw || raw === "primary") {
    const v = root.getPropertyValue("--primary").trim();
    return v ? `hsl(${v})` : "#d4536a";
  }
  return raw;
}

interface GlowingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  glowColor?: string;
  active?: boolean;
  size?: "sm" | "md";
}

export const GlowingButton = React.forwardRef<HTMLButtonElement, GlowingButtonProps>(
  ({ children, className, glowColor, active = false, size = "md", style, ...rest }, ref) => {
    const [resolved, setResolved] = React.useState<string>(() => glowColor || "#d4536a");
    React.useEffect(() => {
      setResolved(resolveColor(glowColor));
      if (glowColor) return;
      // re-resolve on palette change
      const obs = new MutationObserver(() => setResolved(resolveColor()));
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "data-palette", "class"] });
      return () => obs.disconnect();
    }, [glowColor]);

    const c = resolved.startsWith("#") ? hexToRgba(resolved, 1) : resolved;
    const via = resolved.startsWith("#") ? hexToRgba(resolved, 0.1) : resolved.replace(/,\s*1\)/, ", 0.1)");
    const to = resolved.startsWith("#") ? hexToRgba(resolved, 0.28) : resolved.replace(/,\s*1\)/, ", 0.28)");

    return (
      <button
        ref={ref}
        style={{
          ["--glow-color" as any]: c,
          ["--glow-color-via" as any]: via,
          ["--glow-color-to" as any]: to,
          ...style,
        }}
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap",
          "rounded-full border bg-gradient-to-t from-background to-muted",
          "text-foreground transition-all duration-200 font-medium",
          size === "sm" ? "h-9 px-4 text-xs" : "h-10 px-5 text-sm",
          active ? "border-transparent text-foreground" : "border-border/60 text-muted-foreground",
          "after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none",
          "after:bg-gradient-to-r after:from-transparent after:from-40% after:via-[var(--glow-color-via)] after:to-[var(--glow-color-to)] after:via-70%",
          "after:shadow-[hsl(var(--foreground)/0.12)_0px_1px_0px_inset] after:z-[1]",
          "before:absolute before:right-0 before:rounded-l before:z-[2]",
          "before:w-[5px] before:h-[60%] before:bg-[var(--glow-color)]",
          "before:shadow-[-2px_0_10px_var(--glow-color)] before:transition-transform before:duration-300",
          active ? "before:translate-x-0" : "before:translate-x-full hover:before:translate-x-0",
          className,
        )}
        {...rest}
      >
        <span className="relative z-[3]">{children}</span>
      </button>
    );
  },
);
GlowingButton.displayName = "GlowingButton";
