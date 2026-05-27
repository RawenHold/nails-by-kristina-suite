import React from "react";

/**
 * Liquid Glass effect — Apple-style translucent surface with SVG displacement
 * distortion. Use <GlassFilter /> ONCE near the app root so the
 * `url(#liquid-glass-distortion)` filter is available to every <GlassSurface>.
 *
 * Theming: works on both light and dark backgrounds because the layered
 * highlight/sheen stack adapts via color-mix / mix-blend.
 */

interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Apply the SVG displacement filter. Disable on heavy lists for perf. */
  distort?: boolean;
  /** Soften the inner sheen — useful for very small chips. */
  subtle?: boolean;
  /** Render as <button>. */
  as?: "div" | "button";
}

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  ({ children, className = "", style, distort = true, subtle = false, as = "div", ...rest }, ref) => {
    const Tag: any = as;
    return (
      <Tag
        ref={ref as any}
        className={`relative overflow-hidden transition-all duration-500 ${className}`}
        style={{
          boxShadow: "0 6px 18px rgba(0,0,0,0.18), 0 0 24px rgba(0,0,0,0.08)",
          transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
          ...style,
        }}
        {...rest}
      >
        {/* Distortion layer */}
        <div
          aria-hidden
          className="absolute inset-0 z-0 rounded-[inherit]"
          style={{
            backdropFilter: "blur(8px) saturate(1.4)",
            WebkitBackdropFilter: "blur(8px) saturate(1.4)",
            filter: distort ? "url(#liquid-glass-distortion)" : undefined,
            isolation: "isolate",
          }}
        />
        {/* Tint layer — adapts to light/dark via currentColor mix */}
        <div
          aria-hidden
          className="absolute inset-0 z-10 rounded-[inherit] bg-white/30 dark:bg-white/10"
        />
        {/* Inner highlight / glass edge */}
        <div
          aria-hidden
          className="absolute inset-0 z-20 rounded-[inherit] pointer-events-none"
          style={{
            boxShadow: subtle
              ? "inset 1px 1px 0.5px 0 hsl(0 0% 100% / 0.35), inset -1px -1px 0.5px 0.5px hsl(0 0% 100% / 0.25)"
              : "inset 2px 2px 1px 0 hsl(0 0% 100% / 0.55), inset -1px -1px 1px 1px hsl(0 0% 100% / 0.45)",
          }}
        />
        <div className="relative z-30">{children}</div>
      </Tag>
    );
  }
);
GlassSurface.displayName = "GlassSurface";

/** Mount once near the root. */
export const GlassFilter: React.FC = () => (
  <svg aria-hidden style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
    <filter id="liquid-glass-distortion" x="0%" y="0%" width="100%" height="100%" filterUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="17" result="turbulence" />
      <feComponentTransfer in="turbulence" result="mapped">
        <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
        <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
        <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
      </feComponentTransfer>
      <feGaussianBlur in="turbulence" stdDeviation="2" result="softMap" />
      <feDisplacementMap in="SourceGraphic" in2="softMap" scale="20" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </svg>
);
