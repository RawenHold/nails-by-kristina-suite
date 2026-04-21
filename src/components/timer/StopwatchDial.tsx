import { useEffect, useState } from "react";

interface StopwatchDialProps {
  /** Elapsed time in seconds (can be fractional for smooth animation). */
  elapsed: number;
  running: boolean;
}

/**
 * iOS-style stopwatch dial. Two concentric tick rings + a thin sweeping
 * second hand and a smaller minute sub-dial. All visuals are SVG so it
 * scales crisply on every density.
 */
export default function StopwatchDial({ elapsed, running }: StopwatchDialProps) {
  // Smooth sub-second animation via rAF, only while running.
  const [now, setNow] = useState(elapsed);
  useEffect(() => {
    if (!running) { setNow(elapsed); return; }
    let raf = 0;
    const start = performance.now();
    const base = elapsed;
    const tick = (t: number) => {
      setNow(base + (t - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, elapsed]);

  const seconds = now % 60;
  const minutes = Math.floor(now / 60) % 30;
  const secAngle = (seconds / 60) * 360;
  const minAngle = (minutes / 30) * 360;

  // Build tick marks for the outer ring (60 major + minor sub-ticks).
  const outerTicks = [] as JSX.Element[];
  for (let i = 0; i < 240; i++) {
    const isMajor = i % 4 === 0; // every 1s
    const isBig = i % 20 === 0;  // every 5s (numbered)
    const angle = (i / 240) * 360;
    outerTicks.push(
      <line
        key={`o${i}`}
        x1="100" y1="6"
        x2="100" y2={isBig ? 14 : isMajor ? 11 : 9}
        stroke="hsl(var(--muted-foreground))"
        strokeOpacity={isBig ? 0.95 : isMajor ? 0.55 : 0.25}
        strokeWidth={isBig ? 1.4 : isMajor ? 0.9 : 0.6}
        strokeLinecap="round"
        transform={`rotate(${angle} 100 100)`}
      />
    );
  }

  // Numbers for the outer ring (every 5 seconds).
  const outerNumbers = [] as JSX.Element[];
  for (let n = 0; n < 12; n++) {
    const value = (n === 0 ? 60 : n * 5);
    const angle = (n / 12) * 360 - 90;
    const r = 78;
    const x = 100 + r * Math.cos((angle * Math.PI) / 180);
    const y = 100 + r * Math.sin((angle * Math.PI) / 180);
    outerNumbers.push(
      <text
        key={`n${n}`}
        x={x} y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="8.5"
        fontWeight="500"
        fill="hsl(var(--foreground))"
        opacity="0.85"
      >
        {value}
      </text>
    );
  }

  // Inner sub-dial ticks (minutes 0..30).
  const innerTicks = [] as JSX.Element[];
  for (let i = 0; i < 60; i++) {
    const isMajor = i % 2 === 0;
    const isBig = i % 10 === 0;
    const angle = (i / 60) * 360;
    innerTicks.push(
      <line
        key={`i${i}`}
        x1="100" y1="58"
        x2="100" y2={isBig ? 63 : isMajor ? 61 : 60}
        stroke="hsl(var(--muted-foreground))"
        strokeOpacity={isBig ? 0.85 : isMajor ? 0.45 : 0.2}
        strokeWidth={isBig ? 0.8 : 0.5}
        strokeLinecap="round"
        transform={`rotate(${angle} 100 100)`}
      />
    );
  }

  // Inner sub-dial numbers (5..30 step 5).
  const innerNumbers = [] as JSX.Element[];
  for (let n = 1; n <= 6; n++) {
    const value = n * 5;
    const angle = (n / 6) * 360 - 90;
    const r = 51;
    const x = 100 + r * Math.cos((angle * Math.PI) / 180);
    const y = 100 + r * Math.sin((angle * Math.PI) / 180);
    innerNumbers.push(
      <text
        key={`in${n}`}
        x={x} y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="4.5"
        fontWeight="500"
        fill="hsl(var(--foreground))"
        opacity="0.75"
      >
        {value}
      </text>
    );
  }

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Outer ring background */}
      <circle cx="100" cy="100" r="96" fill="none" stroke="hsl(var(--border))" strokeOpacity="0.3" strokeWidth="0.5" />
      {outerTicks}
      {outerNumbers}

      {/* Inner sub-dial */}
      <circle cx="100" cy="100" r="32" fill="none" stroke="hsl(var(--border))" strokeOpacity="0.4" strokeWidth="0.4" />
      {innerTicks}
      {innerNumbers}

      {/* Minute hand (inner) */}
      <g transform={`rotate(${minAngle} 100 100)`}>
        <line x1="100" y1="100" x2="100" y2="72" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="100" cy="72" r="1.1" fill="hsl(var(--primary))" />
      </g>

      {/* Second hand (outer) */}
      <g transform={`rotate(${secAngle} 100 100)`}>
        <line x1="100" y1="115" x2="100" y2="14" stroke="hsl(var(--primary))" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="100" cy="78" r="1.3" fill="hsl(var(--primary))" />
      </g>

      {/* Center caps */}
      <circle cx="100" cy="100" r="2.5" fill="hsl(var(--primary))" />
      <circle cx="100" cy="100" r="0.8" fill="hsl(var(--background))" />
    </svg>
  );
}
