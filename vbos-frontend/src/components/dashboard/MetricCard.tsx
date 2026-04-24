import { cn } from "@/lib/utils";
import { colors } from "@/tokens";

export type MetricAccentColor = "red" | "amber" | "green" | "blue";

export interface MetricCardProps {
  label: string;
  value: string | number;
  /** Secondary line under value; use empty string to hide. */
  subtext: string;
  accentColor: MetricAccentColor;
  delta?: { value: string; direction: "up" | "down" };
  className?: string;
}

const accentBar: Record<MetricAccentColor, string> = {
  red: colors.accent.red,
  amber: colors.accent.amber,
  green: colors.accent.green,
  blue: colors.accent.blue,
};

/**
 * Dashboard metric tile: **2px top accent**, label (mono uppercase), value (Segoe UI Variable 700 26px), optional delta badge.
 */
export function MetricCard({
  label,
  value,
  subtext,
  accentColor,
  delta,
  className,
}: MetricCardProps) {
  const displayValue = typeof value === "number" ? String(value) : value;

  return (
    <div
      className={cn(
        "relative flex min-h-[112px] flex-col overflow-hidden rounded-lg border",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
    >
      {/* Top 2px accent bar */}
      <div
        className="h-0.5 w-full shrink-0"
        style={{ height: 2, backgroundColor: accentBar[accentColor] }}
        aria-hidden
      />

      <div className="flex flex-1 flex-col p-4 pt-3">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.08em]"
          style={{
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            color: colors.text.muted,
          }}
        >
          {label}
        </p>

        <div className="mt-2 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className="min-w-0 truncate text-[26px] font-bold leading-none tracking-tight tabular-nums"
            style={{
              fontFamily: "'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, sans-serif",
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            {displayValue}
          </span>
          {delta ? (
            <span
              className="inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums"
              style={{
                fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
                color:
                  delta.direction === "up" ? colors.accent.green : colors.accent.red,
                backgroundColor:
                  delta.direction === "up"
                    ? `${colors.accent.green}18`
                    : `${colors.accent.red}18`,
              }}
            >
              <span aria-hidden>{delta.direction === "up" ? "↑" : "↓"}</span>
              {delta.value}
            </span>
          ) : null}
        </div>

        {subtext?.trim() ? (
          <p className="mt-2 text-xs leading-snug" style={{ color: colors.text.secondary }}>
            {subtext}
          </p>
        ) : null}
      </div>
    </div>
  );
}
