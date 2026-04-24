import * as React from "react";

import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md";
}

const sizePx: Record<NonNullable<SpinnerProps["size"]>, number> = {
  sm: 16,
  md: 24,
};

/**
 * Minimal single-colour loading indicator (rotating arc).
 */
export function Spinner({ className, size = "md", style, ...props }: SpinnerProps) {
  const s = sizePx[size];
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className={cn("inline-block shrink-0 animate-spin rounded-full", className)}
      style={{
        width: s,
        height: s,
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "color-mix(in srgb, var(--drmis-text-muted) 22%, transparent)",
        borderTopColor: "var(--drmis-text-secondary)",
        ...style,
      }}
      {...props}
    />
  );
}
