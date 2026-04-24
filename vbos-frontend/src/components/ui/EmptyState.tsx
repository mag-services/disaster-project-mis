import * as React from "react";

import { cn } from "@/lib/utils";
import { colors } from "@/tokens";

import { Button } from "./button";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Centered empty / placeholder block with optional primary action.
 */
export function EmptyState({ className, message, action, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[120px] flex-col items-center justify-center gap-4 rounded-lg border px-6 py-10 text-center",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.elevated,
      }}
      {...props}
    >
      <p
        className="max-w-sm text-sm leading-relaxed"
        style={{ color: colors.text.secondary }}
      >
        {message}
      </p>
      {action ? (
        <Button type="button" variant="default" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
