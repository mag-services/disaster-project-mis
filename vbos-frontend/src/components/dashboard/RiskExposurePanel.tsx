import { colors } from "@/tokens";
import { cn } from "@/lib/utils";
import { useRiskExposureByProvince } from "@/hooks/useRiskExposureByProvince";

/** Six Vanuatu provinces (fixed order for dashboard). */
export const RISK_PROVINCES = [
  "Tafea",
  "Malampa",
  "Shefa",
  "Penama",
  "Sanma",
  "Torba",
] as const;

export type RiskProvince = string;

/** Fill colour from composite score (0–100): &gt;70 red, 40–70 amber, &lt;40 green. */
export function riskScoreFillColor(score: number): string {
  if (score > 70) return colors.accent.red;
  if (score >= 40) return colors.accent.amber;
  return colors.accent.green;
}

export interface ProvinceRiskRow {
  province: RiskProvince;
  /** 0–100 exposure score driving bar width and colour. */
  score: number;
}

const PLACEHOLDER_SCORES: ProvinceRiskRow[] = [
  { province: "Tafea", score: 82 },
  { province: "Malampa", score: 55 },
  { province: "Shefa", score: 71 },
  { province: "Penama", score: 38 },
  { province: "Sanma", score: 44 },
  { province: "Torba", score: 22 },
];

export interface RiskExposurePanelProps {
  rows?: ProvinceRiskRow[];
  /** Called when “By Province” is activated (e.g. drill-down or filter). */
  onByProvince?: () => void;
  className?: string;
}

/**
 * Per-province horizontal exposure bars: mono label, 4px track, score-coloured fill, numeric value.
 */
export function RiskExposurePanel({
  rows,
  onByProvince,
  className,
}: RiskExposurePanelProps) {
  const exposureQuery = useRiskExposureByProvince();

  const liveRows: ProvinceRiskRow[] = (exposureQuery.data ?? [])
    .map((row) => ({
      province: row.province,
      score: row.score,
    }))
    .sort((a, b) => {
      const ai = RISK_PROVINCES.indexOf(a.province as (typeof RISK_PROVINCES)[number]);
      const bi = RISK_PROVINCES.indexOf(b.province as (typeof RISK_PROVINCES)[number]);
      const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      return aRank - bRank || a.province.localeCompare(b.province);
    });
  const displayRows =
    rows ??
    (liveRows.length > 0 ? liveRows : PLACEHOLDER_SCORES);

  return (
    <section
      className={cn("flex flex-col overflow-hidden rounded-lg border", className)}
      style={{
        borderColor: colors.border.default,
        backgroundColor: colors.bg.surface,
      }}
      aria-labelledby="risk-exposure-heading"
    >
      <header
        className="flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{ borderColor: colors.border.default }}
      >
        <h2
          id="risk-exposure-heading"
          className="text-sm font-semibold leading-tight"
          style={{ color: colors.text.primary }}
        >
          Risk Exposure
        </h2>
        <button
          type="button"
          className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:bg-muted/30 focus-visible:outline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--drmis-bg-surface)]"
          style={{
            fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
            color: colors.text.muted,
          }}
          onClick={() => onByProvince?.()}
        >
          By Province
        </button>
      </header>

      <div className="space-y-3 p-4">
        {exposureQuery.isLoading && !rows && (
          <p
            className="text-xs"
            style={{
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
              color: colors.text.muted,
            }}
          >
            Loading exposure...
          </p>
        )}
        {displayRows.map((row) => {
          const fill = riskScoreFillColor(row.score);
          const widthPct = Math.min(100, Math.max(0, row.score));

          return (
            <div
              key={row.province}
              className="flex min-w-0 items-center gap-2 sm:gap-3"
            >
              <span
                className="w-[4.5rem] shrink-0 truncate sm:w-24"
                style={{
                  fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: colors.text.secondary,
                }}
              >
                {row.province}
              </span>

              <div
                className="relative min-h-[4px] min-w-0 flex-1 overflow-hidden rounded-full"
                style={{
                  height: 4,
                  backgroundColor: "var(--drmis-track-bg)",
                }}
                role="img"
                aria-label={`${row.province} risk ${row.score} percent`}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: fill,
                  }}
                />
              </div>

              <span
                className="w-9 shrink-0 text-right text-xs font-semibold tabular-nums sm:w-10"
                style={{
                  fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
                  color: colors.text.secondary,
                }}
              >
                {row.score}
              </span>
            </div>
          );
        })}
        {exposureQuery.isError && !rows && (
          <p
            className="pt-1 text-[10px]"
            style={{
              fontFamily: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
              color: colors.text.muted,
            }}
          >
            Live exposure unavailable. Showing fallback values.
          </p>
        )}
      </div>
    </section>
  );
}
