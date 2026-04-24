/**
 * Timeline player: play through years (2004 → 2024) with speed control.
 */
import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import { useDateStore } from "@/store/date-store";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LuPlay, LuPause } from "react-icons/lu";
import { cn } from "@/lib/utils";

const MIN_YEAR = 2004;
const MAX_YEAR = new Date().getFullYear();

const SPEEDS = [
  { value: 1, label: "1x" },
  { value: 2, label: "2x" },
  { value: 5, label: "5x" },
] as const;

/** ms per year at 1x (1 year per second) */
const BASE_INTERVAL_MS = 1000;

export function TimelinePlayer() {
  const { year, setYear } = useDateStore();
  const [value, setValue] = useState([Number(year) || MAX_YEAR - 1]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (!isPlaying) {
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
  }, [isPlaying, speed, advanceYear]);

  const handlePlayPause = () => {
    if (value[0] >= MAX_YEAR) {
      setValue([MIN_YEAR]);
      setYear(String(MIN_YEAR));
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const handleSliderChange = (v: number[]) => {
    setValue(v);
    if (isPlaying && v[0] >= MAX_YEAR) setIsPlaying(false);
  };

  const handleSliderCommit = useCallback(
    (v: number[]) => {
      startTransition(() => setYear(String(v[0])));
    },
    [setYear],
  );

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Timeline
        </Label>
        <span className="font-mono-num text-sm font-semibold tabular-nums">
          {value[0]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handlePlayPause}
          aria-label={isPlaying ? "Pause" : "Play"}
          title={isPlaying ? "Pause" : `Play ${MIN_YEAR} → ${MAX_YEAR}`}
        >
          {isPlaying ? (
            <LuPause className="size-4" />
          ) : (
            <LuPlay className="size-4 ml-0.5" />
          )}
        </Button>
        <div className="slider-neumorphic flex-1 min-w-0">
          <Slider
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={value}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[10px] text-muted-foreground">Speed</span>
        {SPEEDS.map((s) => (
          <Button
            key={s.value}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 px-2 text-xs font-medium",
              speed === s.value && "bg-primary/15 text-primary",
            )}
            onClick={() => setSpeed(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
