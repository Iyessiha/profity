import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  label: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-[0.8125rem] font-medium text-text-muted"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-10 rounded-[var(--radius-control)] border bg-surface-sunken px-3 text-sm text-text-strong placeholder:text-text-faint outline-none transition-colors",
          error
            ? "border-short focus:border-short"
            : "border-line focus:border-accent",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-short" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
