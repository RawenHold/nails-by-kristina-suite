/**
 * AnimatedBackground — soft, slowly-shifting iridescent gradient that sits
 * above the static body::before scene and below all app content.
 *
 * Uses pure CSS keyframes (background-position drift on two large radial
 * gradients + a hue-rotating filter), so it costs almost nothing on the
 * compositor and degrades to a static look under prefers-reduced-motion.
 *
 * Theming is automatic — both layers consume the current palette tokens
 * (--primary, --primary-glow, --accent, --scene-accent), so swapping the
 * palette in Settings instantly re-tints the entire background.
 */
export default function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-[1] overflow-hidden">
      <div className="animated-bg-layer animated-bg-a" />
      <div className="animated-bg-layer animated-bg-b" />
    </div>
  );
}
