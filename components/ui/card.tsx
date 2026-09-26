import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Border, fill and radius mark an element as a separate object, so Card is for
 * things that genuinely are one. Rows inside a card use dividers, not nested
 * cards.
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-line bg-surface-raised",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("font-display text-base font-semibold", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 py-3", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-t border-line bg-surface-sunken px-4 py-3",
        className,
      )}
      {...props}
    />
  );
}

/** Label-and-value row. The label never wraps under the value. */
export function DataRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4 border-b border-line-subtle px-4 py-2.5 last:border-b-0",
        className,
      )}
    >
      <span className="text-[0.8125rem] text-text-muted">{label}</span>
      <span className="text-right text-sm font-medium text-text-strong" data-numeric>
        {children}
      </span>
    </div>
  );
}
