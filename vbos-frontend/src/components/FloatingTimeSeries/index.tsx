import "@/lib/highchartsSetup";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Button } from "@/components/ui/button";
import { LuGripVertical, LuX } from "react-icons/lu";
import { Dataset } from "@/types/api";
import { useLayerStore } from "@/store/layer-store";
import { getAttributes } from "@/utils/getAttributes";
import {
  consolidateTimeSeries,
  hasMonthlyVariation,
} from "@/utils/consolidateTimeSeries";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { useUiStore } from "@/store/ui-store";
import { useMapStore } from "@/store/map-store";
import { lineChartColors } from "../colors";
import { abbreviateUnit } from "@/utils/abbreviateUnit";
import { useHighchartsTheme } from "@/hooks/useHighchartsTheme";

function formatYAxis(value: number): string {
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(value);
}

const FloatingTimeSeries = () => {
  const theme = useHighchartsTheme();
  const { layers, tabularLayerData, getLayerMetadata } = useLayerStore();
  const zoom = useMapStore((s) => s.viewState.zoom);
  const { provinces, acList } = useDeferredArea();
  const { isTimeSeriesOpen, setTimeSeriesOpen } = useUiStore();
  const tabularLayerId = layers.split(",").find((i) => i.startsWith("t"));
  const layerMetadata: Dataset | undefined = tabularLayerId
    ? getLayerMetadata(tabularLayerId)
    : undefined;
  const formattedUnit =
    layerMetadata?.unit === "number"
      ? undefined
      : abbreviateUnit(layerMetadata?.unit ?? "");
  const hasMonthlyData = hasMonthlyVariation(tabularLayerData);

  const [viewMode, setViewMode] = useState<"monthly" | "annual">("annual");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(true);
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      dragRef.current = {
        startX: clientX,
        startY: clientY,
        startPosX: position.x,
        startPosY: position.y,
      };
    },
    [position],
  );

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: dragRef.current.startPosX + clientX - dragRef.current.startX,
      y: dragRef.current.startPosY + clientY - dragRef.current.startY,
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      handleDragMove(e);
    };
    window.addEventListener("mousemove", onMove as EventListener);
    window.addEventListener("mouseup", handleDragEnd);
    window.addEventListener("touchmove", onMove as EventListener, { passive: false });
    window.addEventListener("touchend", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", onMove as EventListener);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", onMove as EventListener);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  useEffect(() => {
    if (hasMonthlyData) {
      setViewMode("monthly");
    } else {
      setViewMode("annual");
    }
  }, [hasMonthlyData]);

  const showMonthlyView = hasMonthlyData && viewMode === "monthly";

  const timeSeriesData = consolidateTimeSeries(
    tabularLayerData,
    showMonthlyView
  );
  const attributes = getAttributes(tabularLayerData);
  const xKey = showMonthlyView ? "month" : "year";

  const chartData = timeSeriesData.map((d) => {
    const row: Record<string, string | number> = { [xKey]: String(d[xKey]) };
    for (const attr of attributes) {
      row[attr.replace(/_/g, " ")] = (d[attr] as number) ?? 0;
    }
    return row;
  });

  const options = useMemo((): Highcharts.Options => {
    const categories = chartData.map((d) => String(d[xKey]));
    const markerSymbols = ["circle", "diamond"] as const;
    const series: Highcharts.SeriesLineOptions[] = attributes.map((attr, index) => ({
      type: "line",
      name: attr.replace(/_/g, " "),
      data: chartData.map((d) => (d[attr.replace(/_/g, " ")] as number) ?? null),
      color: lineChartColors[index % lineChartColors.length],
      lineWidth: 2,
      marker: {
        radius: 4,
        symbol: markerSymbols[index % 2],
        lineWidth: 1,
        lineColor: "#ffffff",
      },
      connectNulls: true,
    }));

    return Highcharts.merge(theme, {
      chart: { type: "line" },
      title: { text: undefined },
      xAxis: { categories },
      yAxis: {
        title: formattedUnit ? { text: formattedUnit, style: { fontSize: "10px" } } : undefined,
        labels: { formatter: function (this: Highcharts.AxisLabelsFormatterContextObject) { return formatYAxis(this.value as number); } },
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
      legend: {
        enabled: true,
        align: "right",
        verticalAlign: "middle",
        layout: "vertical",
      },
    });
  }, [theme, chartData, attributes, xKey, formattedUnit]);

  const isLoading =
    tabularLayerData.length === 0 && tabularLayerId !== undefined;

  if (!isTimeSeriesOpen) return null;

  const zoomNorm = Math.max(0, Math.min(1, (zoom - 6) / 6));
  const scale = 1 + zoomNorm * 0.02;
  const lift = -zoomNorm * 8;

  return (
      <div
        className="contain-panel absolute bottom-4 left-4 right-4 z-[1000] max-w-full overflow-hidden rounded-lg border border-border/40 bg-white shadow-sm md:bottom-6 md:left-auto md:right-6 md:max-w-[440px] dark:border-border/50 dark:bg-card"
      style={{
        transform: `translate(${position.x}px, ${position.y + lift}px) scale(${scale})`,
        transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <div
        className="drag-handle flex items-center justify-between border-b border-border px-4 py-2"
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="flex items-center gap-1 rounded-md bg-black/5 px-2 py-1 dark:bg-white/5">
          <LuGripVertical className="size-4 text-muted-foreground" />
        </div>
        <h3 className="ml-2 text-sm font-semibold text-foreground">
          Time Series
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Close time series"
          onClick={() => setTimeSeriesOpen(false)}
        >
          <LuX className="size-4" />
        </Button>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="mb-4 h-4 w-[40%] animate-pulse rounded bg-muted" />
        ) : (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-muted-foreground">
              {acList.length > 0
                ? acList.join(", ")
                : provinces.length > 0
                  ? provinces.join(", ")
                  : "National Level"}{" "}
              —{" "}
              {layerMetadata
                ? layerMetadata.name
                : "Selected Data Over Time"}
            </h4>
            {hasMonthlyData && (
              <div className="mt-2 flex">
                <Button
                  size="sm"
                  variant={viewMode === "monthly" ? "default" : "outline"}
                  className="rounded-r-none"
                  onClick={() => setViewMode("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "annual" ? "default" : "outline"}
                  className="rounded-l-none border-l-0"
                  onClick={() => setViewMode("annual")}
                >
                  Annual
                </Button>
              </div>
            )}
          </div>
        )}
        {chartData.length > 0 && (
          <div className="min-h-[240px] w-full">
            {isLoading ? (
              <div className="h-[240px] animate-pulse rounded bg-muted" />
            ) : (
              <HighchartsReact
                highcharts={Highcharts}
                options={options}
                containerProps={{ style: { width: "100%", height: 240 } }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingTimeSeries;
