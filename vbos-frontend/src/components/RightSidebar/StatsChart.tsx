import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { TabularData } from "@/types/api";
import { consolidateStats } from "@/utils/consolidateStats";
import { getAttributes } from "@/utils/getAttributes";
import { getTopAttributes } from "@/utils/getTopAttributes";
import { chartColors } from "../colors";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";

type StatsChartType = {
  stats: TabularData[];
  unit?: string | null;
  expanded?: boolean;
  /** Chart title (e.g. "Attribute distribution by province") */
  title?: string;
};

function formatYAxis(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

export function StatsChart({ stats, unit, expanded, title }: StatsChartType) {
  const theme = useHighchartsTheme();
  const { provinces, acList } = useDeferredArea();
  const isAreaCouncilLevel = acList.length > 0;

  const consolidated = consolidateStats(
    stats,
    provinces.length > 0 ? "area_council" : "province",
  );
  const allAttributes = getAttributes(stats);
  const attributes = getTopAttributes(stats, 10);
  const otherAttrs = allAttributes.length > 10 ? allAttributes.filter((a) => !attributes.includes(a)) : [];

  const { data, attrLabels, capped } = useMemo(() => {
    const attrLabels = attributes.map((a) => a.replace(/_/g, " "));
    if (otherAttrs.length > 0) attrLabels.push("Other");
    const data = consolidated.map((d) => {
      const row: Record<string, string | number> = { place: d.place };
      for (const attr of attributes) {
        row[attr.replace(/_/g, " ")] = (d[attr] as number) ?? 0;
      }
      if (otherAttrs.length > 0) {
        const otherTotal = otherAttrs.reduce(
          (sum, attr) => sum + ((d[attr] as number) ?? 0),
          0,
        );
        row["Other"] = otherTotal;
      }
      return row;
    });
    return {
      data,
      attrLabels,
      capped: allAttributes.length > 10,
    };
  }, [consolidated, attributes, otherAttrs, allAttributes.length]);

  const options = useMemo((): Highcharts.Options => {
    const series: Highcharts.SeriesOptionsType[] = attrLabels.map((attr, index) => ({
      type: "bar",
      name: attr,
      data: data.map((row) => (row[attr] as number) ?? 0),
      color: attr === "Other" ? "rgba(148, 163, 184, 0.4)" : chartColors[index % chartColors.length],
      stack: isAreaCouncilLevel ? undefined : "a",
    }));

    return Highcharts.merge(theme, {
      chart: { type: "bar" },
      title: { text: title ?? "Attribute distribution" },
      xAxis: {
        categories: data.map((d) => String(d.place)),
        labels: { style: { fontSize: "10px" }, rotation: -45 },
      },
      yAxis: {
        title: unit ? { text: unit, style: { fontSize: "10px" } } : undefined,
        labels: { formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) { return formatYAxis(this.value as number); } },
      },
      plotOptions: {
        bar: { stacking: isAreaCouncilLevel ? undefined : "normal", borderRadius: 0 },
      },
      series,
      tooltip: {
        shared: true,
        formatter: function () {
          const ctx = this as { points?: Array<{ series: { name: string }; y?: number }>; x?: string };
          const points = ctx.points ?? [];
          let s = `<b>${ctx.x}</b><br/>`;
          points.forEach((p) => {
            s += `${p.series.name}: ${(p.y ?? 0).toLocaleString()}<br/>`;
          });
          return s;
        },
      },
      legend: { enabled: true },
    });
  }, [theme, data, attrLabels, isAreaCouncilLevel, unit, title]);

  if (data.length === 0 || attributes.length === 0) return null;

  return (
    <div className="rounded-lg border border-border/30 bg-white p-4 shadow-sm dark:border-border/40 dark:bg-card/80">
      {capped && (
        <p className="mb-2 text-[10px] text-muted-foreground">
          Top 10 of {allAttributes.length} attributes
        </p>
      )}
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { width: "100%", height: expanded ? 360 : 280 } }}
      />
    </div>
  );
}
