/**
 * Radar/Spider chart for multi-attribute comparison across provinces.
 * Limited to top 10 attributes for readability when datasets have many columns.
 */
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { TabularData } from "@/types/api";
import {
  getAttributes,
  getProvinceAttributeValueSum,
  getAreaCouncilAttributeValueSum,
} from "@/utils/getAttributes";
import { getTopAttributes } from "@/utils/getTopAttributes";
import { chartColors, lineChartColors } from "../colors";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";

type StatsRadarChartProps = {
  stats: TabularData[];
  unit?: string | null;
  expanded?: boolean;
};

export function StatsRadarChart({ stats, expanded }: StatsRadarChartProps) {
  const theme = useHighchartsTheme();
  const { ac } = useDeferredArea();
  const isAreaCouncilLevel = Boolean(ac);

  const attributes = getTopAttributes(stats, 10);
  const placeKey = isAreaCouncilLevel ? "area_council" : "province";
  const places = [...new Set(stats.map((i) => String(i[placeKey] ?? "")).filter(Boolean))];

  const options = useMemo((): Highcharts.Options | null => {
    if (attributes.length < 2 || places.length < 1) return null;

    const getValue = (place: string, attr: string) =>
      isAreaCouncilLevel
        ? getAreaCouncilAttributeValueSum(stats, place, attr)
        : getProvinceAttributeValueSum(stats, place, attr);

    const rawMatrix = places.map((place) =>
      attributes.map((attr) => getValue(place, attr)),
    );

    const mins = attributes.map((_, i) => {
      const vals = rawMatrix.map((row) => row[i]);
      return vals.length ? Math.min(...vals) : 0;
    });
    const maxs = attributes.map((_, i) => {
      const vals = rawMatrix.map((row) => row[i]);
      return vals.length ? Math.max(...vals, 1) : 1;
    });

    const normalized = rawMatrix.map((row) =>
      row.map((v, i) => {
        const min = mins[i];
        const max = maxs[i];
        const range = max - min;
        if (range <= 0) return 0;
        return Math.round(((v - min) / range) * 1000) / 10;
      }),
    );

    const categories = attributes.map((a) => a.replace(/_/g, " "));
    const markerSymbols = ["circle", "diamond"] as const;
    const series: Highcharts.SeriesLineOptions[] = places.map((place, idx) => ({
      type: "line",
      name: place,
      data: normalized.map((row) => row[idx]),
      color: lineChartColors[idx % lineChartColors.length] ?? chartColors[idx % chartColors.length],
      fillOpacity: 0.2,
      lineWidth: 2,
      marker: {
        radius: 3,
        symbol: markerSymbols[idx % 2],
        lineWidth: 1,
        lineColor: "#ffffff",
      },
    }));

    return Highcharts.merge(theme, {
      chart: { polar: true, type: "line" },
      title: { text: undefined },
      xAxis: {
        categories,
        tickmarkPlacement: "on",
        lineWidth: 0,
        labels: { style: { fontSize: "9px" } },
      },
      yAxis: {
        min: 0,
        max: 100,
        tickInterval: 25,
        gridLineInterpolation: "polygon",
        labels: { format: "{value}%" },
      },
      series,
      tooltip: {
        formatter: function (): string {
          const y = (this as unknown as { y?: number }).y;
          return `${(y ?? 0)}% (normalized)`;
        },
      },
      legend: {
        enabled: true,
        align: "right",
        verticalAlign: "middle",
        layout: "vertical",
      },
    });
  }, [theme, stats, attributes, places, isAreaCouncilLevel]);

  if (attributes.length < 2 || places.length < 1) return null;

  const allAttrs = getAttributes(stats);
  const capped = allAttrs.length > 10;

  return (
    <div className="rounded-lg border border-border/30 bg-white p-4 shadow-sm dark:border-border/40 dark:bg-card/80">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Multi-attribute comparison
      </h4>
      {capped && (
        <p className="mb-2 text-[10px] text-muted-foreground">
          Top 10 of {allAttrs.length} attributes (by total value)
        </p>
      )}
      <HighchartsReact
        highcharts={Highcharts}
        options={options!}
        containerProps={{ style: { width: "100%", height: expanded ? 340 : 260 } }}
      />
    </div>
  );
}
