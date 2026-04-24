/**
 * KPI change badge: ↑ +12% or ↓ -4%
 */
import { LuTrendingUp, LuTrendingDown } from "react-icons/lu";
import { cn } from "@/lib/utils";

type KpiDeltaBadgeProps = {
  delta: number;
  format?: "percent" | "absolute";
  className?: string;
};

export function KpiDeltaBadge({ delta, format = "percent", className }: KpiDeltaBadgeProps) {
  const isPositive = delta > 0;
  const isZero = delta === 0;

  if (isZero) return null;

  const text =
    format === "percent"
      ? `${isPositive ? "+" : ""}${delta.toFixed(1)}%`
      : `${isPositive ? "+" : ""}${delta.toFixed(0)}`;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        isPositive && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        !isPositive && "bg-red-500/20 text-red-600 dark:text-red-400",
        className,
      )}
    >
      {isPositive ? (
        <LuTrendingUp className="size-3" aria-hidden />
      ) : (
        <LuTrendingDown className="size-3" aria-hidden />
      )}
      {text}
    </span>
  );
}
