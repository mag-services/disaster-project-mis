import { cn } from "@/lib/utils";
import { colors } from "@/tokens";

export type SystemStatus = "online" | "warning" | "offline";

export interface StatusPillProps {
  status: SystemStatus;
  label: string;
  className?: string;
}

const dotByStatus: Record<SystemStatus, string> = {
  online: colors.severity.low,
  warning: colors.severity.high,
  offline: colors.text.ghost,
};

/** Compact status indicator for the topbar (system health, connectivity, etc.). */
export function StatusPill({ status, label, className }: StatusPillProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1",
        className,
      )}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
      role="status"
      aria-label={label}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: dotByStatus[status] }}
        aria-hidden
      />
      <span
        className="truncate text-[11px] font-medium tracking-tight"
        style={{ color: colors.text.secondary, fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace" }}
      >
        {label}
      </span>
    </div>
  );
}

/** Preset for live system status in the shell topbar. */
export function SystemStatusPill({ label = "Operational" }: { label?: string }) {
  return <StatusPill status="online" label={label} />;
}
