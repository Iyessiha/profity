import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "long" | "short" | "accent";

const VALUE_TONE: Record<Tone, string> = {
  neutral: "text-text-strong",
  long: "text-long",
  short: "text-short",
  accent: "text-accent",
};

export function StatTile({
  label,
  value,
  suffix,
  caption,
  tone = "neutral",
  progress,
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  /** Denominator or unit, set smaller beside the value: "/ 40", "%". */
  suffix?: string;
  caption?: string;
  tone?: Tone;
  /** 0–1. Shown as a bar; values outside the range are clamped. */
  progress?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface-raised p-4",
        className,
      )}
    >
      <span className="label-caps block">{label}</span>
      <div className="mt-1.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-mono text-2xl leading-none font-semibold tabular",
            VALUE_TONE[tone],
          )}
        >
          {value}
        </span>
        {suffix ? (
          <span className="text-sm text-text-faint tabular">{suffix}</span>
        ) : null}
      </div>

      {progress !== undefined ? (
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      ) : null}

      {children}

      {caption ? (
        <span className="mt-2 block text-xs text-text-muted">{caption}</span>
      ) : null}
    </div>
  );
}

/**
 * Compact trend line. The last point is emphasised because "where it stands
 * now" is the thing a sparkline is read for.
 */
export function Sparkline({
  points,
  tone = "long",
  className,
}: {
  points: number[];
  tone?: "long" | "short" | "accent";
  className?: string;
}) {
  if (points.length < 2) return null;

  const W = 220;
  const H = 40;
  const PAD = 3;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = PAD + (1 - (p - min) / span) * (H - PAD * 2);
    return [x, y] as const;
  });

  const line = coords.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
  const [lastX, lastY] = coords[coords.length - 1];
  const stroke = `var(--${tone})`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("mt-3 block h-10 w-full", className)}
      role="img"
      aria-label={`Tendance de ${points[0]} à ${points[points.length - 1]}`}
    >
      <path
        d={`M ${line} L ${W} ${H} L 0 ${H} Z`}
        fill={stroke}
        opacity="0.12"
      />
      <path
        d={`M ${line}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={lastX} cy={lastY} r="2.75" fill={stroke} />
    </svg>
  );
}
