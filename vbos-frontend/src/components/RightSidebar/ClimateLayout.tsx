/**
 * Climate view: Land Accounts dashboard from Land_Accounts 24.02.26.xlsx
 * Storytelling mode (What changed? Why it matters), stacked chart, Sankey change matrix.
 */
import { useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LuInfo } from "react-icons/lu";
import {
  LAND_ACCOUNT_CATEGORIES,
  LAND_ACCOUNT_PROVINCES,
  type LandAccountCategory,
} from "@/data/landAccountsData";
import { useLandAccounts } from "@/hooks/useLandAccounts";
import { LandCoverStorytelling } from "./LandCoverStorytelling";
import { ChangeMatrixSankey } from "./ChangeMatrixSankey";
import { LAND_COVER_COLORS } from "../colors";
import { useColorMode } from "@/components/ui/color-mode";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { cn } from "@/lib/utils";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";

const WHY_THIS_MATTERS =
  "Land cover change affects cyclone buffering, carbon storage, food security, and coastal protection in Vanuatu. The Physical Account tracks stock changes between 2020 and 2023.";

export function ClimateLayout() {
  const theme = useHighchartsTheme();
  const { provinces } = useDeferredArea();
  const { colorMode } = useColorMode();
  const { landAccountsData } = useLandAccounts();
  const [viewMode, setViewMode] = useState<"km2" | "percent">("percent");

  const provincesList = useMemo(() => {
    const list =
      provinces.length > 0
        ? provinces
        : LAND_ACCOUNT_PROVINCES.filter((p: string) =>
          landAccountsData.provinces[p] != null,
        );
    return list;
  }, [provinces, landAccountsData]);

  type ChartRow = { province: string } & Record<LandAccountCategory, number>;

  const chartData = useMemo((): ChartRow[] => {
    return provincesList.map((p) => {
      const pa = landAccountsData.provinces[p]?.physical_account;
      const row: ChartRow = {
        province: p,
        "Water Bodies": 0,
        Grassland: 0,
        Mangrove: 0,
        Bareland: 0,
        "Built Up": 0,
        Forest: 0,
      };
      if (pa) {
        for (const c of LAND_ACCOUNT_CATEGORIES) {
          row[c] = pa.closing[c] ?? 0;
        }
      }
      return row;
    });
  }, [provincesList, landAccountsData]);

  const rowTotals = useMemo(() => {
    return chartData.map((row) => {
      let sum = 0;
      for (const t of LAND_ACCOUNT_CATEGORIES) {
        sum += (row[t] as number) ?? 0;
      }
      return sum;
    });
  }, [chartData]);

  const isDark = colorMode === "dark";
  const palette = LAND_COVER_COLORS[isDark ? "dark" : "light"];

  const barData = useMemo(() => {
    return chartData.map((row, i) => {
      const total = rowTotals[i] || 1;
      const point: Record<string, string | number> = { province: row.province };
      for (const cat of LAND_ACCOUNT_CATEGORIES) {
        const v = (row[cat] as number) ?? 0;
        point[cat] =
          viewMode === "percent"
            ? Math.round((v / total) * 1000) / 10
            : v;
      }
      return point;
    });
  }, [chartData, rowTotals, viewMode]);

  const chartOptions = useMemo((): Highcharts.Options => {
    const series: Highcharts.SeriesColumnOptions[] = LAND_ACCOUNT_CATEGORIES.map((cat) => ({
      type: "column",
      name: cat,
      data: barData.map((row) => (row[cat] as number) ?? 0),
      color: palette[cat] ?? "#888",
      stack: "land",
      borderRadius: 0,
    }));

    const formatY = (v: number) =>
      viewMode === "percent" ? `${v}%` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}K` : String(Math.round(v));

    return Highcharts.merge(theme, {
      chart: { type: "column" },
      title: { text: undefined },
      xAxis: {
        categories: barData.map((r) => r.province),
        labels: {
          rotation: provincesList.length > 3 ? -45 : 0,
          style: { fontSize: "10px" },
        },
      },
      yAxis: {
        min: viewMode === "percent" ? 0 : undefined,
        max: viewMode === "percent" ? 100 : undefined,
        title: {
          text: viewMode === "percent" ? "Share (%)" : "Land area (km²)",
          style: { fontSize: "10px" },
        },
        labels: { formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) { return formatY(this.value as number); } },
      },
      plotOptions: { column: { stacking: "normal" } },
      series,
      tooltip: {
        shared: true,
        formatter: function () {
          const ctx = this as { points?: Array<{ series: { name: string }; y?: number }>; x?: string };
          const points = ctx.points ?? [];
          const total = points.reduce((sum, p) => sum + (p.y ?? 0), 0);
          let s = `<b>${ctx.x}</b><br/>`;
          points.forEach((p) => {
            const v = p.y ?? 0;
            const pct = total > 0 ? ((v / total) * 100).toFixed(1) : "0";
            const val = viewMode === "percent" ? `${v}%` : `${v.toFixed(1)} km²`;
            s += `${p.series.name}: ${val} (${pct}%)<br/>`;
          });
          return s;
        },
      },
      legend: { enabled: true },
    });
  }, [theme, barData, provincesList.length, viewMode, palette]);

  const physicalRows = useMemo(() => {
    const rows: { category: string; opening: number; closing: number; netChange: number }[] = [];
    for (const cat of LAND_ACCOUNT_CATEGORIES) {
      let opening = 0;
      let closing = 0;
      for (const p of provincesList) {
        const pa = landAccountsData.provinces[p]?.physical_account;
        if (pa) {
          opening += pa.opening[cat] ?? 0;
          closing += pa.closing[cat] ?? 0;
        }
      }
      rows.push({
        category: cat,
        opening,
        closing,
        netChange: closing - opening,
      });
    }
    return rows;
  }, [provincesList, landAccountsData]);

  const totalOpening = physicalRows.reduce((s, r) => s + r.opening, 0);
  const totalClosing = physicalRows.reduce((s, r) => s + r.closing, 0);

  return (
    <div className="space-y-5">
      <LandCoverStorytelling />

      <div className="space-y-5 border-t border-border pt-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">Land Accounts</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {provincesList.length > 0 ? `${provincesList.join(", ")} · ` : ""}2020 → 2023
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-full">
                <LuInfo className="size-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="max-w-[280px] text-sm" align="end">
              {WHY_THIS_MATTERS}
            </PopoverContent>
          </Popover>
        </div>

        <Card className="overflow-hidden border-border/60 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Land cover by province</CardTitle>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "percent" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => setViewMode("percent")}
              >
              %
              </Button>
              <Button
                variant={viewMode === "km2" ? "secondary" : "ghost"}
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => setViewMode("km2")}
              >
              km²
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <HighchartsReact
              highcharts={Highcharts}
              options={chartOptions}
              containerProps={{ style: { width: "100%", height: 260 } }}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="physical" className="w-full">
          <TabsList className="mb-3 h-9 w-full justify-start gap-0 bg-muted/50 p-0.5">
            <TabsTrigger value="physical" className="flex-1 text-xs">
            Physical Account
            </TabsTrigger>
            <TabsTrigger value="matrix" className="flex-1 text-xs">
            Change Matrix
            </TabsTrigger>
          </TabsList>

          <TabsContent value="physical" className="mt-0">
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card/50">
              <div className="max-h-[280px] overflow-auto">
                <Table className="table-zebra">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="sticky top-0 z-10 min-w-[100px] bg-muted">
                      Land cover
                      </TableHead>
                      <TableHead className="min-w-[72px] text-right">2020</TableHead>
                      <TableHead className="min-w-[72px] text-right">2023</TableHead>
                      <TableHead className="min-w-[72px] text-right">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {physicalRows.map((row) => (
                      <TableRow key={row.category}>
                        <TableCell className="sticky left-0 z-10 bg-card font-medium">
                          {row.category}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {row.opening.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {row.closing.toFixed(1)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right tabular-nums text-sm font-medium",
                            row.netChange > 0 ? "text-emerald-600 dark:text-emerald-400" : row.netChange < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
                          )}
                        >
                          {row.netChange > 0 ? "+" : ""}
                          {row.netChange.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 border-border bg-muted/40 font-semibold hover:bg-muted/40">
                      <TableCell className="sticky left-0 z-10 bg-muted font-semibold">
                      Total
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {totalOpening.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {totalClosing.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(totalClosing - totalOpening).toFixed(1)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="mt-0">
            <ChangeMatrixSankey />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
