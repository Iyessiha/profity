import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Semantic tones map to market meaning, never to brand: `long` and `short` are
 * reserved for direction and outcome so a badge can never suggest a result it
 * does not report.
 */
const badge = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] border px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide",
  {
    variants: {
      tone: {
        neutral: "border-line bg-surface-sunken text-text-muted",
        accent: "border-accent-line bg-accent-soft text-accent",
        long: "border-long-line bg-long-soft text-long",
        short: "border-short-line bg-short-soft text-short",
        warn: "border-transparent bg-warn-soft text-warn",
        info: "border-transparent bg-info-soft text-info",
        flat: "border-transparent bg-flat-soft text-flat",
      },
      solid: {
        true: "border-transparent",
        false: "",
      },
    },
    compoundVariants: [
      { tone: "long", solid: true, class: "bg-long text-surface-base" },
      { tone: "short", solid: true, class: "bg-short text-surface-base" },
      { tone: "accent", solid: true, class: "bg-accent text-accent-contrast" },
    ],
    defaultVariants: { tone: "neutral", solid: false },
  },
);

export function Badge({
  className,
  tone,
  solid,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badge>) {
  return (
    <span className={cn(badge({ tone, solid }), className)} {...props} />
  );
}

const TIER_LABEL = { free: "Gratuit", pro: "Pro", elite: "Elite" } as const;

export function TierBadge({ tier }: { tier: keyof typeof TIER_LABEL }) {
  return (
    <span
      className="inline-flex items-center rounded-[var(--radius-control)] border px-2 py-0.5 text-[0.6875rem] font-semibold tracking-wide"
      style={{
        color: `var(--tier-${tier})`,
        borderColor: `var(--tier-${tier})`,
        backgroundColor: "transparent",
      }}
    >
      {TIER_LABEL[tier]}
    </span>
  );
}
