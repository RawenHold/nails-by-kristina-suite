import { useEffect, useState } from "react";

/**
 * Decorative animated SVG scene shown in the app header.
 * Reads the global `data-tod` attribute set by `useTimeOfDay`, so the scene
 * stays in sync with the rest of the app's themed background.
 */
export default function HeaderScene({ className = "" }: { className?: string }) {
  const [isNight, setIsNight] = useState(() => {
    const tod = typeof document !== "undefined"
      ? document.documentElement.getAttribute("data-tod")
      : null;
    if (tod) return tod === "evening" || tod === "night";
    const h = new Date().getHours();
    return h >= 18 || h < 6;
  });

  useEffect(() => {
    const update = () => {
      const tod = document.documentElement.getAttribute("data-tod");
      setIsNight(tod === "evening" || tod === "night");
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-tod"] });
    return () => obs.disconnect();
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
        @keyframes flutterPath {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(80px, -10px); }
          50%  { transform: translate(160px, 6px); }
          75%  { transform: translate(80px, 14px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes flap {
          0%, 100% { transform: scaleY(1); }
          50%      { transform: scaleY(0.4); }
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

function Bird({
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
      <path
        d="M -8 0 Q -4 -5 0 0 Q 4 -5 8 0"
        fill="none"
        stroke={fill}
        strokeWidth="1.6"
        strokeLinecap="round"
        style={{ animation: "flap 0.6s ease-in-out infinite", transformOrigin: "0px 0px" }}
      />
    </g>
  );
}

function Butterfly({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g style={{ animation: "flap 0.35s ease-in-out infinite", transformOrigin: "0px 0px" }}>
        <ellipse cx="-3" cy="-1.5" rx="3" ry="2.4" fill="hsl(330 80% 65%)" opacity="0.9" />
        <ellipse cx="-3" cy="2" rx="2.2" ry="1.8" fill="hsl(330 80% 70%)" opacity="0.85" />
        <ellipse cx="3" cy="-1.5" rx="3" ry="2.4" fill="hsl(280 70% 70%)" opacity="0.9" />
        <ellipse cx="3" cy="2" rx="2.2" ry="1.8" fill="hsl(280 70% 75%)" opacity="0.85" />
      </g>
      <ellipse cx="0" cy="0" rx="0.5" ry="2.4" fill="hsl(0 0% 15%)" />
    </g>
  );
}

function TreeRow({ y, fill }: { y: number; fill: string }) {
  const tops = [
    { cx: 20, r: 8 }, { cx: 55, r: 11 }, { cx: 90, r: 7 }, { cx: 120, r: 10 },
    { cx: 160, r: 8 }, { cx: 195, r: 12 }, { cx: 235, r: 9 }, { cx: 270, r: 11 },
    { cx: 305, r: 8 }, { cx: 340, r: 10 }, { cx: 380, r: 9 },
  ];
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x="0" y="6" width="400" height="30" fill={fill} />
      {tops.map((t, i) => (
        <circle key={i} cx={t.cx} cy={6} r={t.r} fill={fill} />
      ))}
    </g>
  );
}

function TreeRowNear({ y, fill }: { y: number; fill: string }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <rect x="0" y="4" width="400" height="22" fill={fill} />
      {[10, 45, 78, 115, 155, 200, 245, 290, 330, 370].map((cx, i) => {
        const h = 10 + ((i * 7) % 6);
        return (
          <path
            key={i}
            d={`M ${cx - 6} 6 L ${cx} ${6 - h} L ${cx + 6} 6 Z`}
            fill={fill}
          />
        );
      })}
      <ellipse cx="60" cy="8" rx="9" ry="4" fill={fill} />
      <ellipse cx="225" cy="8" rx="11" ry="4" fill={fill} />
    </g>
  );
}
