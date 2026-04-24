import { cn } from "@/lib/utils";
import { colors } from "@/tokens";
import { LuBell } from "react-icons/lu";

export interface AlertCountPillProps {
  count: number;
  className?: string;
  /** Screen reader label, e.g. "Unread alerts" */
  ariaLabel?: string;
  pulse?: boolean;
}

/**
 * Topbar alert counter — pill with optional red emphasis when count &gt; 0.
 */
export function AlertCountPill({
  count,
  className,
  ariaLabel = "Alerts",
  pulse = false,
}: AlertCountPillProps) {
  const hasAlerts = count > 0;

  return (
    <button
      type="button"
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
        "hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D90FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]",
        className,
      )}
      style={{
        borderColor: hasAlerts ? colors.accent.red : colors.border.default,
        backgroundColor: hasAlerts ? `${colors.accent.red}18` : colors.bg.surface,
      }}
      aria-label={`${ariaLabel}: ${count}`}
    >
      {pulse && hasAlerts && (
        <span className="absolute -right-1 -top-1 inline-flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-80" />
          <span className="relative inline-flex size-2.5 rounded-full bg-red-600" />
        </span>
      )}
      <LuBell
        className="size-3.5 shrink-0"
        style={{ color: hasAlerts ? colors.accent.red : colors.text.muted }}
        aria-hidden
      />
      <span
        className="min-w-[1.25rem] text-center text-[11px] font-semibold tabular-nums"
        style={{
          color: hasAlerts ? colors.text.primary : colors.text.muted,
          fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
        }}
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}
