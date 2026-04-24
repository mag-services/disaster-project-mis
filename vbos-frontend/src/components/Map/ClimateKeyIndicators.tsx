/**
 * UN-style key indicators cards on top of the map (Climate mode only).
 * Land cover data from useLandCoverStats (same dataset as right sidebar LandCoverTotalsChart).
 * Hover shows additional statistics.
 */
import { useQueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/store/ui-store";
import { useViewStore } from "@/store/view-store";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { useDateStore } from "@/store/date-store";
import { useLayerStore } from "@/store/layer-store";
import { useLandCoverStats } from "@/hooks/useLandCoverStats";
import { LAND_COVER_PIXEL_COLORS } from "@/config/landCover";
import { LuTreeDeciduous, LuWaves, LuMapPin } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui";
import type { PaginatedVectorData } from "@/types/api";
import type { LandCoverClassData } from "@/hooks/useLandCoverStats";

function IndicatorCard({
  label,
  value,
  unit,
  icon: Icon,
  color,
  tooltip,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  tooltip?: React.ReactNode;
}) {
  const card = (
    <div
      className={cn(
        "pointer-events-auto flex cursor-default items-center gap-2.5 rounded-lg border border-border/60 bg-card/95 px-3 py-2 shadow-md backdrop-blur-sm",
        "min-w-0 dark:border-white/10 dark:bg-card/90",
      )}
    >
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: color ? `${color}25` : "hsl(var(--muted))",
          color: color ?? undefined,
        }}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold tabular-nums text-foreground">
          {value}
          {unit && <span className="ml-0.5 text-xs font-normal text-muted-foreground">{unit}</span>}
        </p>
      </div>
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} positioning={{ placement: "bottom" }}>
        {card}
      </Tooltip>
    );
  }
  return card;
}

export function ClimateKeyIndicators() {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const { province } = useDeferredArea();
  const { year } = useDateStore();
  const { layers, getLayerMetadata } = useLayerStore();
  const queryClient = useQueryClient();

  const { total, byPixel, data: landCoverData } = useLandCoverStats();

  if (scenarioId !== "climate" || !selectedClimateModule) return null;

  const indicators: React.ReactNode[] = [];

  // --- Land cover: show whenever we have data (both Land Use and Coastal modes) ---
  if (total > 0) {
    const forestArea = byPixel["5"] ?? 0;
    const mangroveArea = byPixel["2"] ?? 0;
    const builtUpArea = byPixel["4"] ?? 0;
    const forestPct = Math.round((forestArea / total) * 1000) / 10;
    const mangrovePct = Math.round((mangroveArea / total) * 1000) / 10;
    const builtUpPct = Math.round((builtUpArea / total) * 1000) / 10;

    indicators.push(
      <IndicatorCard
        key="forest"
        label="Forest cover"
        value={forestPct}
        unit="%"
        icon={LuTreeDeciduous}
        color={LAND_COVER_PIXEL_COLORS["5"]}
        tooltip={
          <div className="space-y-0.5">
            <p className="font-medium">Forest cover</p>
            <p className="opacity-90">{forestArea.toFixed(1)} km²</p>
          </div>
        }
      />,
    );
    indicators.push(
      <IndicatorCard
        key="mangrove"
        label="Mangrove"
        value={mangrovePct}
        unit="%"
        icon={LuWaves}
        color={LAND_COVER_PIXEL_COLORS["2"]}
        tooltip={
          <div className="space-y-0.5">
            <p className="font-medium">Mangrove</p>
            <p className="opacity-90">{mangroveArea.toFixed(1)} km²</p>
          </div>
        }
      />,
    );
    if (builtUpPct > 0) {
      indicators.push(
        <IndicatorCard
          key="builtup"
          label="Built up"
          value={builtUpPct}
          unit="%"
          icon={LuMapPin}
          color={LAND_COVER_PIXEL_COLORS["4"]}
          tooltip={
            <div className="space-y-0.5">
              <p className="font-medium">Built up</p>
              <p className="opacity-90">{builtUpArea.toFixed(1)} km²</p>
            </div>
          }
        />,
      );
    }
    indicators.push(
      <IndicatorCard
        key="total"
        label="Total area"
        value={`${total.toFixed(1)} km²`}
        icon={LuMapPin}
        tooltip={
          landCoverData.length > 0 ? (
            <div className="space-y-1">
              <p className="font-medium">Land cover breakdown</p>
              <ul className="space-y-0.5 opacity-90">
                {landCoverData.map((d: LandCoverClassData) => (
                  <li key={d.name}>
                    {d.name}: {d.area.toFixed(1)} km² ({d.y}%)
                  </li>
                ))}
              </ul>
            </div>
          ) : undefined
        }
      />,
    );
  }

  if (selectedClimateModule === "coastal") {
    const vectorLayerIds = layers.split(",").filter((l) => l.startsWith("v"));
    const activeIds = new Set(
      vectorLayerIds.map((id) => {
        const meta = getLayerMetadata(id);
        return meta?.id;
      }).filter((x): x is number => typeof x === "number"),
    );
    let featureCount = 0;
    const allVector = queryClient.getQueriesData<PaginatedVectorData>({
      queryKey: ["dataset", "vector"],
    });
    for (const [qk, data] of allVector) {
      const id = Array.isArray(qk) && typeof qk[2] === "number" ? qk[2] : null;
      if (id != null && activeIds.has(id) && data?.features?.length) {
        featureCount += data.features.length;
      }
    }
    indicators.push(
      <IndicatorCard
        key="coastal"
        label="Shoreline features"
        value={featureCount}
        unit=" segments"
        icon={LuWaves}
        tooltip={
          <div className="space-y-0.5">
            <p className="font-medium">Shoreline segments</p>
            <p className="opacity-90">
              {featureCount > 0
                ? `${featureCount} segments from active coastal layers`
                : "No segments loaded. Enable Rates of Change layer."}
            </p>
          </div>
        }
      />,
    );
  }

  // --- Filter context (secondary) ---
  indicators.push(
    <IndicatorCard
      key="year"
      label="Year"
      value={year}
      icon={LuMapPin}
        tooltip={
          <div className="space-y-0.5">
            <p className="font-medium">Data year</p>
            <p className="opacity-90">Statistics for {year}</p>
          </div>
        }
    />,
  );
  indicators.push(
    <IndicatorCard
      key="area"
      label="Area"
      value={province || "National"}
      icon={LuMapPin}
        tooltip={
          <div className="space-y-0.5">
            <p className="font-medium">Selected area</p>
            <p className="opacity-90">
            {province ? `${province} province` : "National (all provinces)"}
          </p>
        </div>
      }
    />,
  );

  // Cards removed from map overlay — data available in right sidebar charts
  void indicators;
  return null;
}
