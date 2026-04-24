import { cn } from "@/lib/utils";

interface RadialGaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  icon?: React.ReactNode;
}

const SEVERITY_COLORS = [
  { threshold: 25, color: "stroke-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10" },
  { threshold: 50, color: "stroke-amber-500", text: "text-amber-500", bg: "bg-amber-500/10" },
  { threshold: 75, color: "stroke-orange-500", text: "text-orange-500", bg: "bg-orange-500/10" },
  { threshold: 100, color: "stroke-red-500", text: "text-red-500", bg: "bg-red-500/10" },
];

function getSeverity(value: number, max: number) {
  const pct = (value / max) * 100;
  return SEVERITY_COLORS.find((s) => pct <= s.threshold) ?? SEVERITY_COLORS[SEVERITY_COLORS.length - 1];
}

export function RadialGauge({
  value,
  max = 100,
  label,
  unit = "%",
  size = 120,
  strokeWidth = 8,
  icon,
}: RadialGaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - pct);
  const severity = getSeverity(value, max);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-muted"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={cn(severity.color, "transition-all duration-700 ease-out")}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <div className={cn("mb-0.5", severity.text)}>{icon}</div>}
          <span className={cn("font-mono-num text-lg font-bold tabular-nums leading-none", severity.text)}>
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground">{unit}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
