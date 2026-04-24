import { cn } from "@/lib/utils";

export interface TaskProgressBarProps {
  /** 0–100 */
  progress: number;
  label?: string;
  className?: string;
  /** Hide the numeric percent (default false). */
  hidePercent?: boolean;
  /** When true, show a simple pulse instead of a fixed width (e.g. PENDING). */
  indeterminate?: boolean;
}

export function TaskProgressBar({
  progress,
  label,
  className,
  hidePercent = false,
  indeterminate = false,
}: TaskProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className={cn("w-full space-y-1", className)}>
      {label ? (
        <div className="text-xs text-muted-foreground">{label}</div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {indeterminate ? (
          <div className="h-full w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse" />
        ) : (
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {!hidePercent && !indeterminate ? (
        <div className="text-right text-[10px] tabular-nums text-muted-foreground">{pct}%</div>
      ) : null}
    </div>
  );
}
