/**
 * Bottom control panel below the map: Animate (slider + play) vs Swipe (two year dropdowns).
 * Inspired by Esri Land Cover Explorer.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LuPlay, LuPause, LuSlidersHorizontal } from "react-icons/lu";
import { useDateStore } from "@/store/date-store";
import { useComparisonStore } from "@/store/comparison-store";
import { useLayerStore } from "@/store/layer-store";
import { useScenario } from "@/hooks/useScenario";
import { useLandCoverRaster } from "@/hooks/useLandCoverRaster";
import { cn } from "@/lib/utils";

const MIN_YEAR = 2004;
const MAX_YEAR = new Date().getFullYear();
const BASE_INTERVAL_MS = 1000;

const YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => String(MAX_YEAR - i),
);

export function MapBottomPanel() {
  const { year, setYear } = useDateStore();
  const {
    comparisonMode,
    setComparisonMode,
    setComparisonView,
    comparisonView,
    yearLeft,
    yearRight,
    setYearLeft,
    setYearRight,
  } = useComparisonStore();
  const scenario = useScenario();
  const { layers, setLayers, setAllDatasets } = useLayerStore();
  const landCover = useLandCoverRaster();
  const [value, setValue] = useState([Number(year) || MAX_YEAR - 1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const speed = 1;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasRaster = scenario.uiConfig.showComparison;
  const hasTabular = true;
  const isSwipeMode = comparisonMode && comparisonView === "swipe";

  useEffect(() => {
    const n = Number(year);
    if (!Number.isNaN(n)) setValue([Math.min(MAX_YEAR, Math.max(MIN_YEAR, n))]);
  }, [year]);

  const advanceYear = useCallback(() => {
    setValue((prev) => {
      const next = prev[0] + 1;
      if (next > MAX_YEAR) {
        setIsPlaying(false);
        setYear(String(MAX_YEAR));
        return [MAX_YEAR];
      }
      setYear(String(next));
      return [next];
    });
  }, [setYear]);

  useEffect(() => {
    if (!isPlaying || isSwipeMode) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    const intervalMs = BASE_INTERVAL_MS / speed;
    intervalRef.current = setInterval(advanceYear, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, advanceYear, isSwipeMode]);

  const handlePlayPause = () => {
    if (value[0] >= MAX_YEAR) {
      setValue([MIN_YEAR]);
      setYear(String(MIN_YEAR));
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const handleSliderCommit = useCallback(
    (v: number[]) => {
      setYear(String(v[0]));
    },
    [setYear],
  );

  const handleAnimateClick = () => {
    setComparisonMode(false);
  };

  const handleSwipeClick = () => {
    setComparisonMode(true);
    setComparisonView("swipe");
    // Swipe needs a raster layer; auto-activate land cover if none active
    const hasRasterLayer = layers.split(",").some((l) => l.startsWith("r"));
    if (landCover && !hasRasterLayer) {
      setAllDatasets([landCover.dataset], { replace: false });
      const current = layers.split(",").filter(Boolean);
      const vectors = current.filter((l) => l.startsWith("v") || l.startsWith("p"));
      setLayers([...vectors, landCover.layerId].filter(Boolean).join(",") || landCover.layerId);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[900] border-t border-border/80 bg-background/95 px-4 py-3 shadow-[0_-4px_20px_-4px_rgb(0_0_0/0.08)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {(hasRaster || hasTabular) && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
            <div className="flex rounded-lg border border-border p-0.5">
              <button
                type="button"
                onClick={handleAnimateClick}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  !isSwipeMode
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <LuPlay className="size-3.5" />
                Animate
              </button>
              <button
                type="button"
                onClick={handleSwipeClick}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  isSwipeMode
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <LuSlidersHorizontal className="size-3.5" />
                Swipe
              </button>
            </div>
          </div>
        )}

        {isSwipeMode ? (
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-xs font-medium text-muted-foreground sm:shrink-0">
              Choose two years to compare
            </p>
            <div className="flex items-center gap-2">
              <Select value={yearLeft} onValueChange={setYearLeft}>
                <SelectTrigger className="h-9 w-[88px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">vs</span>
              <Select value={yearRight} onValueChange={setYearRight}>
                <SelectTrigger className="h-9 w-[88px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handlePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : `Animate ${MIN_YEAR} → ${MAX_YEAR}`}
            >
              {isPlaying ? (
                <LuPause className="size-4" />
              ) : (
                <LuPlay className="size-4 ml-0.5" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{MIN_YEAR}</span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {value[0]}
                </span>
                <span>{MAX_YEAR}</span>
              </div>
              <Slider
                min={MIN_YEAR}
                max={MAX_YEAR}
                value={value}
                onValueChange={setValue}
                onValueCommit={handleSliderCommit}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
