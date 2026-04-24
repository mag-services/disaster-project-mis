import { useState, startTransition } from "react";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui";
import { LuX, LuInfo, LuFocus } from "react-icons/lu";
import { LayerInfoModal } from "./LayerInfoModal";
import type {
  LegendLayer,
  TabularLegendLayer,
  VectorLegendLayer,
  RasterLegendLayer,
} from "./types";
import { MAP_COLORS } from "../../colors";
import { useColorMode } from "../../ui/color-mode";
import { buildVectorPinIconSvg } from "../../Map/vectorIcons";
import { abbreviateUnit } from "@/utils/abbreviateUnit";
import { CYCLONE_INTENSITY_LEGEND } from "@/config/disaster";

type LayerEntryProps = LegendLayer & {
  switchLayer: (layerId: string) => void;
  setOpacity: (layerId: string, opacity: number) => void;
};

export function LayerEntry(props: LayerEntryProps) {
  const {
    dataType,
    id,
    name,
    switchLayer,
    setOpacity: setOpacityStore,
  } = props;
  const [infoOpen, setInfoOpen] = useState(false);
  const layerId = `${dataType.charAt(0)}${id}`;
  const { getOpacity } = useOpacityStore();
  const { focusedLayerId, setFocusedLayerId } = useFocusStore();
  const opacity = getOpacity(layerId);
  const isFocused = focusedLayerId === layerId;

  const handleRemove = () => {
    if (isFocused) setFocusedLayerId(null);
    startTransition(() => switchLayer(layerId));
  };

  const handleOpacityChange = (v: number[]) => {
    setOpacityStore(layerId, v[0]);
  };

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <div className="flex w-full flex-shrink-0">
          <p className="mr-auto line-clamp-1 text-sm font-medium">
            {name}
          </p>
          <div className="flex shrink-0 gap-0">
            <Tooltip
              content={isFocused ? "Exit focus mode" : "Focus this layer"}
              positioning={{ placement: "top" }}
            >
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={isFocused ? "Exit focus mode" : "Focus this layer"}
                onClick={() => setFocusedLayerId(isFocused ? null : layerId)}
                className={isFocused ? "text-primary" : undefined}
              >
                <LuFocus className="size-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Layer info" positioning={{ placement: "top" }}>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Layer info"
                onClick={() => setInfoOpen(true)}
              >
                <LuInfo className="size-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Remove layer" positioning={{ placement: "top" }}>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Remove layer"
                onClick={handleRemove}
              >
                <LuX className="size-4" />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="flex w-full min-w-[60px] flex-1 items-center gap-2">
          <span className="shrink-0 text-[10px] text-muted-foreground">
            Opacity
          </span>
          <Slider
            value={[opacity]}
            onValueChange={handleOpacityChange}
            min={0}
            max={100}
            className="min-w-[60px] flex-1"
          />
          <span className="w-8 shrink-0 text-[10px] text-muted-foreground">
            {opacity}%
          </span>
        </div>
        <div className="min-w-0 w-full flex-1 [&:empty]:hidden">
          {dataType === "tabular" && (
            <TabularEntry {...(props as TabularLegendLayer)} />
          )}
          {["vector", "pmtiles"].includes(dataType) && (
            <VectorEntry {...(props as VectorLegendLayer)} />
          )}
          {dataType === "raster" && (
            <RasterEntry {...(props as RasterLegendLayer)} />
          )}
        </div>
      </div>
      <LayerInfoModal
        layer={props}
        open={infoOpen}
        onOpenChange={setInfoOpen}
      />
    </>
  );
}

function TabularEntry(props: TabularLegendLayer) {
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const { unit, dataRange, isPending, hasData, source, dataYear } = props;
  const formattedUnit = unit === "number" ? undefined : abbreviateUnit(unit);
  return (
    <div className="flex w-full flex-col gap-2">
      {dataRange && (dataRange.max !== 0 || dataRange.min !== 0) ? (
        <div className="flex w-full flex-col gap-1">
          <div
            className="h-4 w-full overflow-hidden rounded-md"
            style={{
              background: `linear-gradient(to right, ${mapPalette.choroplethLow}, ${mapPalette.choroplethMid}, ${mapPalette.choroplethHigh}, ${mapPalette.choroplethMax})`,
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {dataRange.min.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {formattedUnit ? ` ${formattedUnit}` : ""}
            </span>
            <span className="text-right">
              {dataRange.max.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              {formattedUnit ? ` ${formattedUnit}` : ""}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col gap-1">
          {isPending ? (
            <Skeleton className="h-4 w-full" />
          ) : (
            <div className="h-4 w-full rounded-sm bg-muted opacity-50" />
          )}
          <p className="text-xs italic text-muted-foreground">
            {isPending
              ? "Loading data..."
              : hasData === false
                ? "Data unavailable for the time or area selected."
                : "Loading data..."}
          </p>
        </div>
      )}
      {!dataRange && unit && (
        <p className="text-xs text-muted-foreground">{formattedUnit}</p>
      )}
      {(source || dataYear) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {source && <span title="Data source">{source}</span>}
          {dataYear && <span className="font-medium">Year: {dataYear}</span>}
        </div>
      )}
    </div>
  );
}

function VectorEntry(props: VectorLegendLayer) {
  const { name, geometryType, color, iconKey, unit, cyclone_name } = props;
  const isPoint = geometryType.includes("Point");
  const isLine = geometryType.includes("Line");
  const formattedUnit = unit === "number" ? undefined : abbreviateUnit(unit);

  const isCycloneIntensity =
    cyclone_name || name?.toLowerCase().includes("cyclone intensity");

  if (isCycloneIntensity) {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          {CYCLONE_INTENSITY_LEGEND.map(({ label, color: c }) => (
            <div
              key={label}
              className="flex items-center gap-2"
            >
              <div
                className="h-3 w-4 shrink-0 rounded-sm border border-border/60"
                style={{ backgroundColor: c }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        {isPoint && (
          <>
            <div
              className="flex h-4 min-w-4 shrink-0 items-center justify-center [&>div]:leading-none [&>svg]:block"
              dangerouslySetInnerHTML={{
                __html: iconKey
                  ? buildVectorPinIconSvg(color, iconKey, 16)
                  : `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="6" fill="${color}"/></svg>`,
              }}
            />
            <p className="text-xs text-muted-foreground">{name}</p>
          </>
        )}
        {isLine && (
          <>
            <div
              className="h-[3px] w-3 shrink-0 rounded-full ring-1 ring-border/40"
              style={{ backgroundColor: color }}
            />
            <p className="text-xs text-muted-foreground">{name}</p>
          </>
        )}
        {!isPoint && !isLine && (
          <>
            <div
              className="h-3 w-4 shrink-0 rounded-full border-2"
              style={{ borderColor: color, backgroundColor: `${color}33` }}
            />
            <p className="text-xs text-muted-foreground">{geometryType}</p>
          </>
        )}
      </div>
      {unit && (
        <p className="text-xs text-muted-foreground">{formattedUnit}</p>
      )}
    </div>
  );
}

function RasterEntry(props: RasterLegendLayer) {
  const { unit, source, dataYear } = props;
  const formattedUnit = unit === "number" ? undefined : abbreviateUnit(unit);
  if (!unit && !source && !dataYear) return null;
  return (
    <div className="flex flex-col gap-1">
      {formattedUnit && (
        <p className="text-xs text-muted-foreground">{formattedUnit}</p>
      )}
      {(source || dataYear) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {source && <span title="Data source">{source}</span>}
          {dataYear && <span className="font-medium">Year: {dataYear}</span>}
        </div>
      )}
    </div>
  );
}
