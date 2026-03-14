"use client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  /** Controls the diameter of the spinner. Defaults to "md". */
  size?: SpinnerSize;
  /** Additional Tailwind classes applied to the root element. */
  className?: string;
  /** Accessible label announced by screen readers. */
  label?: string;
  /** Main accent colour. Defaults to #2da8e0 (sky blue). */
  color?: string;
}

// ---------------------------------------------------------------------------
// Size map
// ---------------------------------------------------------------------------

const SIZE_MAP: Record<SpinnerSize, number> = {
  sm: 48,
  md: 80,
  lg: 120,
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Spinner
 *
 * An orbital / atom-style loading indicator with:
 *  - A solid filled centre dot
 *  - Two concentric dashed rings
 *  - Small dot "satellites" orbiting each ring at different speeds
 *
 * Everything is pure SVG — no external deps, no canvas.
 *
 * @example
 * <Spinner />
 * <Spinner size="lg" color="#10b981" />
 */
export function Spinner({
  size = "md",
  className,
  label = "Loading…",
  color = "#2da8e0",
}: SpinnerProps) {
  const dim = SIZE_MAP[size];
  const cx = dim / 2;
  const cy = dim / 2;

  // Ring radii — proportional to total size
  const r1 = dim * 0.18; // inner ring
  const r2 = dim * 0.36; // outer ring

  // Stroke & dot sizes
  const ringStroke = dim * 0.025;
  const dotR1 = dim * 0.055; // satellite on inner ring
  const dotR2 = dim * 0.065; // satellite on outer ring
  const centreDot = dim * 0.11;

  // Dash pattern — creates the "broken circle" look
  const innerCirc = 2 * Math.PI * r1;
  const outerCirc = 2 * Math.PI * r2;
  const dashRatio = 0.82; // fraction of circumference that's solid

  const uid = "orb"; // stable prefix — fine for SSR

  return (
    <>
      <style>{`
        @keyframes ${uid}_cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ${uid}_ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        .${uid}_inner {
          transform-origin: ${cx}px ${cy}px;
          animation: ${uid}_cw 2.8s linear infinite;
        }
        .${uid}_outer {
          transform-origin: ${cx}px ${cy}px;
          animation: ${uid}_ccw 4s linear infinite;
        }
        .${uid}_pulse {
          animation: ${uid}_pulse_kf 1.8s ease-in-out infinite;
        }
        @keyframes ${uid}_pulse_kf {
          0%, 100% { opacity: 1;   r: ${centreDot}; }
          50%       { opacity: 0.7; r: ${centreDot * 0.82}; }
        }
      `}</style>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        role="status"
        aria-label={label}
        aria-live="polite"
        className={cn("shrink-0", className)}
      >
        {/* ── Static dashed rings ── */}

        {/* Inner ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r1}
          fill="none"
          stroke={color}
          strokeWidth={ringStroke}
          strokeOpacity={0.35}
          strokeDasharray={`${innerCirc * dashRatio} ${innerCirc * (1 - dashRatio)}`}
          strokeLinecap="round"
        />

        {/* Outer ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r2}
          fill="none"
          stroke={color}
          strokeWidth={ringStroke}
          strokeOpacity={0.35}
          strokeDasharray={`${outerCirc * dashRatio} ${outerCirc * (1 - dashRatio)}`}
          strokeLinecap="round"
        />

        {/* ── Rotating group: inner satellite ── */}
        <g className={`${uid}_inner`}>
          <circle
            cx={cx}
            cy={cy - r1}   /* top of inner ring */
            r={dotR1}
            fill={color}
          />
        </g>

        {/* ── Rotating group: outer satellite ── */}
        <g className={`${uid}_outer`}>
          {/* Primary dot — starts at top-right */}
          <circle
            cx={cx + r2 * Math.cos(-Math.PI / 6)}
            cy={cy + r2 * Math.sin(-Math.PI / 6)}
            r={dotR2}
            fill={color}
          />
          {/* Secondary smaller dot — 180° offset */}
          <circle
            cx={cx + r2 * Math.cos(-Math.PI / 6 + Math.PI)}
            cy={cy + r2 * Math.sin(-Math.PI / 6 + Math.PI)}
            r={dotR2 * 0.6}
            fill={color}
            fillOpacity={0.5}
          />
        </g>

        {/* ── Pulsing centre dot ── */}
        <circle
          cx={cx}
          cy={cy}
          r={centreDot}
          fill={color}
          className={`${uid}_pulse`}
        />
      </svg>
    </>
  );
}

export default Spinner;