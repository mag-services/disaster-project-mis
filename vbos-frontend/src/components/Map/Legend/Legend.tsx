import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LuGripVertical, LuChevronDown, LuChevronUp, LuListTree } from "react-icons/lu";
import { Tooltip } from "@/components/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useScenario } from "@/hooks/useScenario";
import { useLegendLayers } from "@/components/Map/Legend/hooks/useLegendLayers";
import { useLandCoverRaster } from "@/hooks/useLandCoverRaster";
import { LayerEntry } from "./LayerEntry";
import { MAP_COLORS, getDeltaColor } from "@/components/colors";
import { useColorMode } from "@/components/ui/color-mode";
import { cn } from "@/lib/utils";

type LegendProps = {
  /** When true, renders inline for context panel (no absolute positioning) */
  embedded?: boolean;
  /** `map` = bottom-left overlay; `chrome` = compact control in top map toolbar */
  variant?: "map" | "chrome";
};

export function Legend({ embedded = false, variant = "map" }: LegendProps = {}) {
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const { switchLayer, reorderLayers, layers } = useLayerStore();
  const { setOpacity } = useOpacityStore();
  const { comparisonMode, comparisonView, yearLeft, yearRight } = useComparisonStore();
  const scenario = useScenario();
  const legendLayers = useLegendLayers();
  const landCover = useLandCoverRaster();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showDiffLegend, setShowDiffLegend] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const hasLandCoverRaster = landCover && layers.split(",").includes(landCover.layerId);
  const hideWhenLandCoverDominates = scenario.id === "climate" && hasLandCoverRaster;

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === toIndex) return;
      reorderLayers(draggedIndex, toIndex);
      setDraggedIndex(null);
    },
    [draggedIndex, reorderLayers],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const headerRow = (
    <div className="flex items-center justify-between gap-1 border-b border-border px-2 py-2 max-md:py-2.5">
      <h2 className="text-xs font-semibold leading-snug max-md:text-[11px]">Legend</h2>
      <Button
        variant="ghost"
        size="icon"
        className="drmis-touch-target size-9 min-h-9 min-w-9 shrink-0 md:size-9"
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand legend" : "Collapse legend"}
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <LuChevronDown className="size-3.5" />
        ) : (
          <LuChevronUp className="size-3.5" />
        )}
      </Button>
    </div>
  );

  const compareBlock =
    !collapsed && comparisonMode ? (
      <>
        <div className="border-b border-border bg-primary/10 px-2 py-1.5 text-center text-xs font-medium leading-snug text-primary">
          Compare: {yearLeft} ↔ {yearRight}
        </div>
        <div className="border-b border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 min-h-9 w-full justify-between gap-1 px-2 text-xs font-normal leading-snug"
            onClick={() => setShowDiffLegend((v) => !v)}
            aria-expanded={showDiffLegend}
          >
            {comparisonView === "delta" ? "Delta heatmap" : "Show difference legend"}
            {showDiffLegend ? (
              <LuChevronUp className="size-3.5" />
            ) : (
              <LuChevronDown className="size-3.5" />
            )}
          </Button>
          {showDiffLegend && (
            <div className="px-2 pb-2 pt-0">
              {comparisonView === "delta" ? (
                <>
                  <div
                    className="h-3 w-full rounded-[var(--drmis-radius-card)]"
                    style={{
                      background: `linear-gradient(to right, ${getDeltaColor(-1, mapPalette)}, ${getDeltaColor(0, mapPalette)}, ${getDeltaColor(1, mapPalette)})`,
                    }}
                  />
                  <div className="mt-1 flex justify-between text-[10px] leading-snug text-muted-foreground">
                    <span>Decrease</span>
                    <span>No change</span>
                    <span>Increase</span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="h-3 w-full rounded-[var(--drmis-radius-card)]"
                    style={{
                      background: `linear-gradient(to right, ${mapPalette.choroplethLow}, ${mapPalette.choroplethMid}, ${mapPalette.choroplethHigh}, ${mapPalette.choroplethMax})`,
                    }}
                  />
                  <div className="mt-1 flex justify-between text-[10px] leading-snug text-muted-foreground">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </>
    ) : null;

  const layerList = !collapsed && (
    <ul className="m-0 flex w-full list-none flex-col gap-0 p-0 text-xs leading-relaxed max-md:max-h-[25vh] max-md:overflow-y-auto max-md:overscroll-contain">
      {legendLayers.map((layer, index) => (
        <li
          key={`${layer.dataType}-${layer.id}`}
          className={`flex items-start gap-1 border-b border-border p-2.5 last:border-b-0 ${
            draggedIndex === index ? "opacity-60" : ""
          } cursor-grab active:cursor-grabbing`}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
        >
          <Tooltip content="Drag to reorder" positioning={{ placement: "top" }}>
            <Button
              variant="ghost"
              size="icon-xs"
              className="mt-0.5 min-h-9 min-w-9 shrink-0 cursor-grab touch-manipulation"
              aria-label="Drag to reorder layer"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <LuGripVertical className="size-4" />
            </Button>
          </Tooltip>
          <div className="min-w-0 flex-1">
            <LayerEntry {...layer} switchLayer={switchLayer} setOpacity={setOpacity} />
          </div>
        </li>
      ))}
    </ul>
  );

  if (variant === "chrome") {
    const disabledLandCover = hideWhenLandCoverDominates;
    const disabledEmpty = !legendLayers.length;
    if (disabledLandCover) {
      return (
        <Button
          type="button"
          variant="ghost"
          disabled
          className="drmis-touch-target h-11 min-h-11 shrink-0 rounded-none border-0 px-3 text-xs shadow-none"
        >
          <span className="max-w-[5rem] truncate">Land cover</span>
        </Button>
      );
    }
    if (disabledEmpty) {
      return (
        <Button
          type="button"
          variant="ghost"
          disabled
          className="drmis-touch-target h-11 min-h-11 shrink-0 rounded-none border-0 px-3 text-xs shadow-none"
        >
          Legend
        </Button>
      );
    }
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="drmis-touch-target h-11 min-h-11 shrink-0 gap-1.5 rounded-none border-0 px-3 text-xs font-medium shadow-none hover:bg-muted/40"
            aria-label="Open map legend and layer opacity"
          >
            <LuListTree className="size-4 shrink-0 text-muted-foreground" />
            <span className="hidden sm:inline">Legend</span>
            <Badge variant="secondary" className="h-5 shrink-0 rounded-full px-1.5 text-[10px]">
              {legendLayers.length}
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={8}
          className="w-[min(22rem,calc(100vw-2rem))] max-h-[min(70vh,32rem)] overflow-hidden border-border p-0 shadow-[var(--drmis-shadow-md)] duration-200"
        >
          <div className="flex max-h-[min(70vh,32rem)] flex-col overflow-y-auto overscroll-contain" role="list">
            {headerRow}
            {compareBlock}
            {layerList}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  if (!legendLayers.length) return null;
  if (hideWhenLandCoverDominates) return null;

  return (
    <div
      className={
        embedded
          ? "w-full overflow-hidden rounded-[var(--drmis-radius-card)] border border-border bg-muted/20 shadow-[var(--drmis-shadow-sm)]"
          : cn(
              "absolute left-2 bottom-4 z-[1000] max-h-[40vh] overflow-hidden rounded-[var(--drmis-radius-card)] border border-border shadow-[var(--drmis-shadow-sm)] glass-surface max-md:left-2 max-md:bottom-20 max-md:max-h-[35vh] max-md:w-[220px] md:w-[320px] md:max-h-none",
            )
      }
      role="list"
    >
      {headerRow}
      {compareBlock}
      {layerList}
    </div>
  );
}
