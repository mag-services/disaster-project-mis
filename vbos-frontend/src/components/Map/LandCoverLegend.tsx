/**
 * Dedicated legend for land cover raster in Climate mode.
 * Shows 6 classes (QGIS scheme 0–5) with color swatch, name, and short description.
 * Click a class to toggle its visibility on the map.
 * Includes opacity control when land cover raster is active.
 */
import { useEffect } from "react";
import { useScenario } from "@/hooks/useScenario";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useLandCoverFilterStore } from "@/store/land-cover-filter-store";
import { LAND_COVER_CLASS_ORDER, LAND_COVER_PIXEL_COLORS } from "@/config/landCover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const LAND_COVER_DESCRIPTIONS: Record<string, string> = {
  "Water Bodies": "Rivers, lakes, lagoons",
  Grassland: "Open grassland, savanna",
  Mangrove: "Coastal mangrove forest",
  Bareland: "Exposed soil, rock, sand",
  "Built Up": "Settlements, roads",
  Forest: "Forest cover",
};

export function LandCoverLegend() {
  const scenario = useScenario();
  const { layers } = useLayerStore();
  const { getOpacity, setOpacity } = useOpacityStore();
  const { isVisible, toggleClass } = useLandCoverFilterStore();

  const rasterLayerId = layers.split(",").find((l) => l.startsWith("r"));
  const hasRasterLayer = !!rasterLayerId;
  const opacity = rasterLayerId ? (getOpacity(rasterLayerId) ?? 100) : 100;

  // Reset opacity to 100 when accidentally set to 0 (layer invisible)
  // Must run unconditionally (before any early return) to satisfy Rules of Hooks
  useEffect(() => {
    if (rasterLayerId && opacity === 0) {
      setOpacity(rasterLayerId, 100);
    }
  }, [rasterLayerId, opacity, setOpacity]);

  if (scenario.uiConfig.sidebarLayout !== "climate" || !hasRasterLayer) return null;

  return (
    <div
      className="absolute left-2 bottom-4 z-[1000] w-[240px] overflow-hidden rounded-[var(--drmis-radius-card)] border border-border shadow-[var(--drmis-shadow-sm)] glass-surface max-md:left-2 max-md:bottom-20 max-md:w-[200px] max-md:max-h-[30vh]"
      role="list"
    >
      <h3 className="border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Classes — click to toggle
      </h3>
      <ul className="m-0 max-h-[240px] list-none overflow-y-auto p-0 text-xs max-md:max-h-[180px]">
        {LAND_COVER_CLASS_ORDER.map((type, i) => {
          const visible = isVisible(type);
          const color = LAND_COVER_PIXEL_COLORS[String(i)] ?? "#888";
          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => toggleClass(type)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-2 border-b border-border/60 px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-muted/50",
                  !visible && "opacity-50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 size-4 shrink-0 rounded-full ring-1 ring-border/60",
                    !visible && "ring-2 ring-dashed",
                  )}
                  style={{
                    backgroundColor: visible ? color : "transparent",
                  }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{type}</span>
                  <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
                    {LAND_COVER_DESCRIPTIONS[type] ?? ""}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {rasterLayerId && (
        <div className="border-t border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[10px] text-muted-foreground">
              Opacity
            </span>
            <Slider
              value={[opacity]}
              onValueChange={(v) => setOpacity(rasterLayerId, v[0])}
              min={0}
              max={100}
              step={5}
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}
