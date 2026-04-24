/**
 * Change Matrix → Sankey diagram with animated transitions
 */
import { useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { LAND_ACCOUNT_CATEGORIES } from "@/data/landAccountsData";
import { LAND_COVER_COLORS } from "../colors";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { useColorMode } from "@/components/ui/color-mode";
import { useLandAccounts } from "@/hooks/useLandAccounts";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";

type FlowLink = { from: string; to: string; weight: number; color?: string };

export function ChangeMatrixSankey() {
  const theme = useHighchartsTheme();
  const { provinces } = useDeferredArea();
  const { colorMode } = useColorMode();
  const { landAccountsData } = useLandAccounts();

  const { data: sankeyData, totalFlow } = useMemo(() => {
    const matrix =
      provinces.length === 1
        ? landAccountsData.provinces[provinces[0]]?.change_matrix
        : null;
    if (!matrix) return { data: [] as FlowLink[], totalFlow: 0 };

    const links: FlowLink[] = [];
    const palette = LAND_COVER_COLORS[colorMode === "dark" ? "dark" : "light"];

    for (const fromCat of LAND_ACCOUNT_CATEGORIES) {
      const row = matrix[fromCat];
      if (!row) continue;
      for (const toCat of LAND_ACCOUNT_CATEGORIES) {
        if (fromCat === toCat) continue;
        const w = row[toCat] ?? 0;
        if (w < 0.5) continue;
        links.push({
          from: fromCat,
          to: toCat,
          weight: w,
          color: palette[toCat] ?? undefined,
        });
      }
    }

    const total = links.reduce((s, l) => s + l.weight, 0);
    return { data: links, totalFlow: total };
  }, [provinces, colorMode, landAccountsData]);

  if (provinces.length !== 1 || sankeyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Select a province to view the change matrix
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Flow diagram shows land cover transitions from 2020 to 2023.
        </p>
      </div>
    );
  }

  const sankeyChartData = sankeyData.map((l) => ({
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
            data: sankeyChartData,
            nodeWidth: 16,
            nodePadding: 6,
            linkOpacity: 0.5,
            curveFactor: 0.5,
            dataLabels: { style: { fontSize: "10px" } },
            tooltip: {
              formatter: function (): string {
                const w = (this as unknown as { point?: { weight?: number } }).point?.weight;
                return `${(w ?? 0).toFixed(1)} km²`;
              },
            },
          },
        ],
      }),
    [theme, sankeyChartData],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
      <p className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
        {provinces[0]}: From → To (km²) · {totalFlow.toFixed(0)} km² total flow
      </p>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { width: "100%", height: 320 } }}
      />
    </div>
  );
}
