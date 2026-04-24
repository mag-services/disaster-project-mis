import * as React from "react";

import { cn } from "@/lib/utils";
import { colors } from "@/tokens";

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional header area (title row, actions, tabs, etc.). */
  header?: React.ReactNode;
}

/**
 * Dark surface card with border; optional header strip above body.
 */
export function Panel({ className, header, children, ...props }: PanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
      {...props}
    >
      {header != null && header !== false ? (
        <div
          className="shrink-0 border-b px-4 py-3"
          style={{ borderColor: colors.border.default }}
        >
          {header}
        </div>
      ) : null}
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </section>
  );
}
