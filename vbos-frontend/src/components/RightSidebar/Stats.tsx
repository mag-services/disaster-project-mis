import { startTransition } from "react";
import { LuChartLine, LuCircleX } from "react-icons/lu";
import { useAreaStore } from "@/store/area-store";
import {
  applyTabularFilters,
  useFilteredTabularData,
} from "@/hooks/useFilteredTabularData";
import { useLayerStore } from "@/store/layer-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";
import { DATASET_TYPES } from "@/utils/datasetTypes";
import { Dataset } from "@/types/api";
import { StatsChart } from "./StatsChart";
import { StatsPieChart } from "./StatsPieChart";
import { StatsRadarChart } from "./StatsRadarChart";
import { StatsSankeyChart } from "./StatsSankeyChart";
import { StatsTable } from "./StatsTable";
import { Tooltip } from "../ui";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { abbreviateUnit } from "@/utils/abbreviateUnit";
import { KpiDeltaBadge } from "@/components/ui/KpiDeltaBadge";

function StatsSkeleton() {
  return (
    <div
      className="mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      role="status"
      aria-label="Loading stats"
    >
      <div className="flex items-center border-b border-border px-4 py-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex gap-1">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="size-6 rounded-md" />
        </div>
      </div>
      <div className="space-y-4 p-4">
        <Skeleton className="h-[200px] w-full" />
        <div className="flex gap-4">
          <Skeleton className="h-[120px] flex-1" />
          <Skeleton className="h-[120px] flex-1" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

export function Stats() {
  const { layers, tabularLayerData, getLayerMetadata, switchLayer } =
    useLayerStore();
  const { comparisonMode, yearLeft, yearRight } = useComparisonStore();
  const { toggleTimeSeries, isTimeSeriesOpen, rightSidebarExpanded } = useUiStore();
  const { provinces, acList } = useAreaStore();
  const tabularAttributeFilter = useLayerStore((s) => s.tabularAttributeFilter);
  const filteredData = useFilteredTabularData();

  const deltaPercent = (() => {
    if (!comparisonMode || !tabularLayerData.length) return null;
    const dataLeft = applyTabularFilters(
      tabularLayerData,
      yearLeft,
      provinces,
      acList,
      tabularAttributeFilter,
    );
    const dataRight = applyTabularFilters(
      tabularLayerData,
      yearRight,
      provinces,
      acList,
      tabularAttributeFilter,
    );
    const sumLeft = dataLeft.reduce((a, r) => a + (Number(r.value) || 0), 0);
    const sumRight = dataRight.reduce((a, r) => a + (Number(r.value) || 0), 0);
    if (sumLeft === 0) return sumRight > 0 ? 100 : 0;
    return ((sumRight - sumLeft) / sumLeft) * 100;
  })();
  const tabularLayerId = layers.split(",").find((i) => i.startsWith("t"));
  const layerMetadata: Dataset | undefined = tabularLayerId
    ? getLayerMetadata(tabularLayerId)
    : undefined;
  const unit = layerMetadata
    ? layerMetadata?.unit === "number"
      ? undefined
      : abbreviateUnit(layerMetadata?.unit)
    : undefined;

  if (!tabularLayerId) {
    return null;
  }

  if (tabularLayerData.length === 0 && filteredData.length === 0) {
    return <StatsSkeleton />;
  }

  if (!layerMetadata) {
    return <StatsSkeleton />;
  }

  return (
    <div
      className={cn(
        "mt-4 overflow-hidden rounded-lg border border-border bg-card shadow-sm",
        rightSidebarExpanded &&
          "rounded-xl border-border/50 shadow-md ring-1 ring-black/5",
      )}
      data-pdf-stats
    >
      <div
        className={cn(
          "flex items-center border-b border-border/60 px-4 py-3",
          rightSidebarExpanded && "px-5 py-4",
        )}
      >
        <div className="flex-1">
          <p className="block text-xs text-muted-foreground">
            {layerMetadata.cluster ?? "Climate"} | {DATASET_TYPES[layerMetadata.type]}
          </p>
          <p className="flex items-center gap-2">
            {layerMetadata.name}
            {deltaPercent !== null && deltaPercent !== 0 && (
              <KpiDeltaBadge delta={deltaPercent} format="percent" />
            )}
          </p>
        </div>
        <div className="flex flex-row gap-1">
          <Tooltip content="View time series">
            <Button
              size="icon-xs"
              variant={isTimeSeriesOpen ? "default" : "ghost"}
              onClick={toggleTimeSeries}
              disabled={filteredData.length === 0}
            >
              <LuChartLine className="size-4" />
            </Button>
          </Tooltip>
          <Tooltip content="Remove layer from map">
            <Button
              size="icon-xs"
              variant="ghost"
              className="hover:text-destructive"
              onClick={() => startTransition(() => switchLayer(tabularLayerId))}
              aria-label="Remove layer from map"
            >
              <LuCircleX className="size-4" />
            </Button>
          </Tooltip>
        </div>
      </div>
      {filteredData.length === 0 ? (
        <div className="block p-2 text-sm">
          No data is available for the selected year or administrative area.
          Please select a different time period or area.
        </div>
      ) : (
        <div
          className={cn(
            "chart-stagger gap-4 p-4",
            rightSidebarExpanded
              ? "grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 md:p-6"
              : "flex flex-col",
          )}
        >
          <StatsChart
            stats={filteredData}
            unit={unit}
            expanded={rightSidebarExpanded}
            title={
              acList.length > 0
                ? "Attribute distribution by area council"
                : "Attribute distribution by province"
            }
          />
          <StatsSankeyChart stats={filteredData} unit={unit} expanded={rightSidebarExpanded} />
          <StatsRadarChart stats={filteredData} unit={unit} expanded={rightSidebarExpanded} />
          <StatsPieChart stats={filteredData} unit={unit} expanded={rightSidebarExpanded} />
          <div className={cn(rightSidebarExpanded && "md:col-span-2")}>
            <StatsTable stats={filteredData} unit={unit} />
          </div>
        </div>
      )}
    </div>
  );
}
