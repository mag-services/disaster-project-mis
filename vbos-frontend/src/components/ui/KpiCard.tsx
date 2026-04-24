/**
 * Reusable KPI card with drill-down on click and threshold alerts.
 */
import { LuMapPin, LuCircleAlert } from "react-icons/lu";
import { KpiDeltaBadge } from "./KpiDeltaBadge";
import { cn } from "@/lib/utils";
import type { KpiResult } from "@/config/kpis";

export interface KpiCardProps {
  label: string;
  result: KpiResult;
  unit: string;
  /** Show trend badge (delta) */
  trend?: boolean;
  /** Show map pin icon when no delta */
  showMapPin?: boolean;
  /** Click handler for drill-down */
  onClick?: () => void;
  /** Optional extra content (e.g. sparkline) */
  children?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  label,
  result,
  unit,
  trend = false,
  showMapPin = false,
  onClick,
  children,
  className,
}: KpiCardProps) {
  const hasDrillDown = !!onClick;
  const hasAlert = !!result.alert;

  return (
    <div
      role={hasDrillDown ? "button" : undefined}
      tabIndex={hasDrillDown ? 0 : undefined}
      onClick={hasDrillDown ? onClick : undefined}
      onKeyDown={
        hasDrillDown
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        "kpi-bento-card rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md",
        hasDrillDown && "cursor-pointer hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/50",
        className,
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {hasAlert && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              result.alert!.severity === "danger" &&
                "bg-red-500/20 text-red-600 dark:text-red-400",
              result.alert!.severity === "warning" &&
                "bg-amber-500/20 text-amber-600 dark:text-amber-400",
            )}
            title={result.alert!.label}
          >
            <LuCircleAlert className="size-3" aria-hidden />
            {result.alert!.label}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        {showMapPin && result.delta === undefined && (
          <LuMapPin className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
        )}
        {trend && result.delta !== undefined && result.delta !== 0 && (
          <KpiDeltaBadge delta={result.delta} format="absolute" />
        )}
        <p className="font-mono-num text-lg font-bold leading-tight tabular-nums">
          {result.formatted}
        </p>
        {unit && (
          <span className="text-xs font-normal text-muted-foreground">{unit}</span>
        )}
      </div>
      {children}
    </div>
  );
}
