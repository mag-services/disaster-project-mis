/**
 * Sankey diagram for resource flows (e.g. Immediate Response Resources).
 * Limited to top 10 sectors for readability when datasets have many columns.
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
import { chartColors } from "../colors";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";

type StatsSankeyChartProps = {
  stats: TabularData[];
  unit?: string | null;
  expanded?: boolean;
};

type FlowLink = { from: string; to: string; weight: number; color?: string };

export function StatsSankeyChart({ stats, expanded }: StatsSankeyChartProps) {
  const theme = useHighchartsTheme();
  const { province, ac } = useDeferredArea();
  const isAreaCouncilLevel = Boolean(ac);

  const allAttrs = getAttributes(stats);
  const attributes = getTopAttributes(stats, 10);
  const capped = allAttrs.length > 10;
  const placeKey = isAreaCouncilLevel ? "area_council" : "province";
  const places = [
    ...new Set(stats.map((i) => String(i[placeKey] ?? "")).filter(Boolean)),
  ];

  if (attributes.length < 1 || places.length < 1) return null;

  const getValue = (place: string, attr: string) =>
    isAreaCouncilLevel
      ? getAreaCouncilAttributeValueSum(stats, place, attr)
      : getProvinceAttributeValueSum(stats, place, attr);

  const links: FlowLink[] = [];
  const sourceLabel = isAreaCouncilLevel ? province ?? "National" : "National";
  const sectorColors = chartColors.slice(0, attributes.length);
  const otherAttrs = capped ? allAttrs.filter((a) => !attributes.includes(a)) : [];
  const otherColor = "#94a3b8";

  if (isAreaCouncilLevel) {
    for (const place of places) {
      const placeTotal = allAttrs.reduce(
        (sum, attr) => sum + getValue(place, attr),
        0,
      );
      if (placeTotal > 0) {
        links.push({ from: sourceLabel, to: place, weight: placeTotal });
      }
      for (let i = 0; i < attributes.length; i++) {
        const v = getValue(place, attributes[i]);
        if (v > 0) {
          links.push({
            from: place,
            to: attributes[i].replace(/_/g, " "),
            weight: v,
            color: sectorColors[i],
          });
        }
      }
      if (capped && otherAttrs.length > 0) {
        const otherTotal = otherAttrs.reduce(
          (sum, attr) => sum + getValue(place, attr),
          0,
        );
        if (otherTotal > 0) {
          links.push({
            from: place,
            to: "Other",
            weight: otherTotal,
            color: otherColor,
          });
        }
      }
    }
  } else {
    for (const place of places) {
      const placeTotal = allAttrs.reduce(
        (sum, attr) => sum + getValue(place, attr),
        0,
      );
      if (placeTotal > 0) {
        links.push({ from: sourceLabel, to: place, weight: placeTotal });
      }
      for (let i = 0; i < attributes.length; i++) {
        const v = getValue(place, attributes[i]);
        if (v > 0) {
          links.push({
            from: place,
            to: attributes[i].replace(/_/g, " "),
            weight: v,
            color: sectorColors[i],
          });
        }
      }
      if (capped && otherAttrs.length > 0) {
        const otherTotal = otherAttrs.reduce(
          (sum, attr) => sum + getValue(place, attr),
          0,
        );
        if (otherTotal > 0) {
          links.push({
            from: place,
            to: "Other",
            weight: otherTotal,
            color: otherColor,
          });
        }
      }
    }
  }

  if (links.length === 0) return null;

  const sankeyData = links.map((l) => ({
    from: l.from,
    to: l.to,
    weight: l.weight,
    ...(l.color && { color: l.color }),
  }));

  const options = useMemo(
    (): Highcharts.Options =>
      Highcharts.merge(theme, {
        chart: { type: "sankey" },
        title: { text: undefined },
        series: [
          {
            type: "sankey",
            name: "Flow",
            data: sankeyData,
            nodeWidth: 18,
            nodePadding: 8,
            linkOpacity: 0.5,
            curveFactor: 0.5,
            dataLabels: { style: { fontSize: "10px" } },
            tooltip: {
              formatter: function (): string {
                const w = (this as unknown as { point?: { weight?: number } }).point?.weight;
                return (w ?? 0).toLocaleString();
              },
            },
          },
        ],
      }),
    [theme, sankeyData],
  );

  return (
    <div className="rounded-lg border border-border/30 bg-white p-4 shadow-sm dark:border-border/40 dark:bg-card/80">
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Resource flow: {sourceLabel} → {isAreaCouncilLevel ? "Area Councils" : "Provinces"} → Sectors
      </h4>
      {capped && (
        <p className="mb-2 text-[10px] text-muted-foreground">
          Top 10 of {allAttrs.length} sectors
        </p>
      )}
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { width: "100%", height: expanded ? 380 : 300 } }}
      />
    </div>
  );
}
