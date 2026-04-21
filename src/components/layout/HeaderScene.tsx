import { useMemo } from "react";

/**
 * Decorative animated SVG scene shown in the app header.
 * - Morning / Day (06:00–17:59): warm sun, soft clouds, sparkles
 * - Evening / Night (18:00–05:59): full moon with stars and drifting clouds
 *
 * Pure SVG + CSS animations — no JS frame loop, GPU-cheap on mobile.
 */
export default function HeaderScene({ className = "" }: { className?: string }) {
  const isNight = useMemo(() => {
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 400 90"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
      >
        <defs>
          {/* Sky gradients */}
          <linearGradient id="sky-day" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(200 90% 78%)" />
            <stop offset="60%" stopColor="hsl(30 90% 88%)" />
            <stop offset="100%" stopColor="hsl(15 85% 82%)" />
          </linearGradient>
          <linearGradient id="sky-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(235 55% 18%)" />
            <stop offset="60%" stopColor="hsl(260 45% 28%)" />
            <stop offset="100%" stopColor="hsl(285 40% 32%)" />
          </linearGradient>

          {/* Sun */}
          <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(50 100% 88%)" />
            <stop offset="55%" stopColor="hsl(40 100% 65%)" />
            <stop offset="100%" stopColor="hsl(28 95% 55%)" />
          </radialGradient>
          <radialGradient id="sun-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45 100% 70%)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="hsl(45 100% 70%)" stopOpacity="0" />
          </radialGradient>

          {/* Moon */}
          <radialGradient id="moon-core" cx="40%" cy="40%" r="65%">
            <stop offset="0%" stopColor="hsl(48 30% 96%)" />
            <stop offset="70%" stopColor="hsl(45 25% 86%)" />
            <stop offset="100%" stopColor="hsl(40 20% 70%)" />
          </radialGradient>
          <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(220 60% 88%)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="hsl(220 60% 88%)" stopOpacity="0" />
          </radialGradient>

          {/* Clouds */}
          <linearGradient id="cloud-day" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(0 0% 100%)" />
            <stop offset="100%" stopColor="hsl(220 30% 92%)" />
          </linearGradient>
          <linearGradient id="cloud-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(230 25% 75%)" />
            <stop offset="100%" stopColor="hsl(245 30% 55%)" />
          </linearGradient>

          {/* Tree silhouettes */}
          <linearGradient id="tree-day" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(150 35% 35%)" />
            <stop offset="100%" stopColor="hsl(150 40% 22%)" />
          </linearGradient>
          <linearGradient id="tree-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(230 30% 18%)" />
            <stop offset="100%" stopColor="hsl(240 35% 10%)" />
          </linearGradient>
        </defs>

        {/* Background sky */}
        <rect
          width="400"
          height="90"
          fill={isNight ? "url(#sky-night)" : "url(#sky-day)"}
        />

        {isNight ? (
          <>
            {/* Twinkling stars */}
            {[
              { cx: 40, cy: 22, r: 0.8, d: "0s" },
              { cx: 95, cy: 14, r: 1.1, d: "1.2s" },
              { cx: 150, cy: 30, r: 0.7, d: "0.6s" },
              { cx: 205, cy: 18, r: 1, d: "2s" },
              { cx: 260, cy: 38, r: 0.8, d: "0.4s" },
              { cx: 310, cy: 12, r: 1.2, d: "1.6s" },
              { cx: 360, cy: 28, r: 0.9, d: "2.4s" },
              { cx: 70, cy: 50, r: 0.6, d: "1.8s" },
              { cx: 380, cy: 60, r: 0.7, d: "0.9s" },
            ].map((s, i) => (
              <circle
                key={i}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill="hsl(48 100% 92%)"
                style={{
                  animation: `twinkle 2.4s ease-in-out ${s.d} infinite`,
                  transformOrigin: `${s.cx}px ${s.cy}px`,
                }}
              />
            ))}

            {/* Moon */}
            <g style={{ animation: "floatY 6s ease-in-out infinite" }}>
              <circle cx="320" cy="36" r="32" fill="url(#moon-glow)" />
              <circle cx="320" cy="36" r="18" fill="url(#moon-core)" />
              {/* craters */}
              <circle cx="313" cy="31" r="2.4" fill="hsl(40 18% 78%)" opacity="0.7" />
              <circle cx="326" cy="40" r="1.8" fill="hsl(40 18% 78%)" opacity="0.6" />
              <circle cx="318" cy="43" r="1.3" fill="hsl(40 18% 78%)" opacity="0.5" />
            </g>

            {/* Drifting clouds */}
            <g style={{ animation: "driftL 28s linear infinite" }}>
              <Cloud x={60} y={50} scale={0.9} fill="url(#cloud-night)" opacity={0.85} />
            </g>
            <g style={{ animation: "driftR 36s linear infinite" }}>
              <Cloud x={220} y={62} scale={0.75} fill="url(#cloud-night)" opacity={0.7} />
            </g>

            {/* Owl silhouette flying */}
            <g style={{ animation: "driftR 24s linear infinite" }}>
              <Bird x={0} y={42} scale={0.55} fill="hsl(240 30% 12%)" opacity={0.85} />
            </g>
          </>
        ) : (
          <>
            {/* Sun */}
            <g style={{ animation: "floatY 5s ease-in-out infinite" }}>
              <circle
                cx="320"
                cy="34"
                r="38"
                fill="url(#sun-glow)"
                style={{ animation: "pulseGlow 4s ease-in-out infinite", transformOrigin: "320px 34px" }}
              />
              <circle cx="320" cy="34" r="18" fill="url(#sun-core)" />
            </g>

            {/* Sparkles */}
            {[
              { cx: 50, cy: 16, d: "0s" },
              { cx: 130, cy: 10, d: "0.8s" },
              { cx: 215, cy: 18, d: "1.4s" },
              { cx: 90, cy: 32, d: "2s" },
            ].map((s, i) => (
              <g
                key={i}
                style={{
                  animation: `twinkle 2.6s ease-in-out ${s.d} infinite`,
                  transformOrigin: `${s.cx}px ${s.cy}px`,
                }}
              >
                <path
                  d={`M${s.cx} ${s.cy - 3} L${s.cx + 0.8} ${s.cy - 0.8} L${s.cx + 3} ${s.cy} L${s.cx + 0.8} ${s.cy + 0.8} L${s.cx} ${s.cy + 3} L${s.cx - 0.8} ${s.cy + 0.8} L${s.cx - 3} ${s.cy} L${s.cx - 0.8} ${s.cy - 0.8} Z`}
                  fill="hsl(48 100% 92%)"
                  opacity="0.9"
                />
              </g>
            ))}

            {/* Drifting fluffy clouds */}
            <g style={{ animation: "driftL 32s linear infinite" }}>
              <Cloud x={70} y={52} scale={0.95} fill="url(#cloud-day)" opacity={0.95} />
            </g>
            <g style={{ animation: "driftR 42s linear infinite" }}>
              <Cloud x={240} y={64} scale={0.8} fill="url(#cloud-day)" opacity={0.85} />
            </g>

            {/* Birds gliding */}
            <g style={{ animation: "driftR 22s linear infinite" }}>
              <Bird x={0} y={26} scale={0.5} fill="hsl(225 35% 30%)" opacity={0.7} />
              <Bird x={18} y={32} scale={0.35} fill="hsl(225 35% 30%)" opacity={0.6} />
            </g>

            {/* Butterfly */}
            <g
              style={{
                animation: "flutterPath 14s ease-in-out infinite",
                transformOrigin: "center",
              }}
            >
              <Butterfly x={130} y={54} scale={0.7} />
            </g>
          </>
        )}

        {/* Tree silhouettes — far layer */}
        <g opacity="0.55">
          <TreeRow fill={isNight ? "url(#tree-night)" : "url(#tree-day)"} y={68} />
        </g>
        {/* Tree silhouettes — near layer */}
        <g>
          <TreeRowNear fill={isNight ? "url(#tree-night)" : "url(#tree-day)"} y={74} />
        </g>
      </svg>

      <style>{`
        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.35; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes driftL {
          0% { transform: translateX(-40px); }
          100% { transform: translateX(440px); }
        }
        @keyframes driftR {
          0% { transform: translateX(440px); }
          100% { transform: translateX(-80px); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-hidden="true"] * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function Cloud({
  x,
  y,
  scale = 1,
  fill,
  opacity = 1,
}: {
  x: number;
  y: number;
  scale?: number;
  fill: string;
  opacity?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
      <ellipse cx="0" cy="6" rx="22" ry="8" fill={fill} />
      <circle cx="-12" cy="2" r="9" fill={fill} />
      <circle cx="0" cy="-2" r="11" fill={fill} />
      <circle cx="13" cy="3" r="9" fill={fill} />
    </g>
  );
}
