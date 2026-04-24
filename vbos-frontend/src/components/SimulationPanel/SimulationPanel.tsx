import { useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  CloudRain,
  Gauge,
  Loader2,
  Play,
  RotateCcw,
  Sprout,
  TrendingUp,
  Users,
  Waves,
  X,
  Zap,
  DollarSign,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TooltipCompat, TooltipProvider } from "@/components/ui/tooltip";
import { useSimulationStore } from "@/store/simulation-store";
import { RadialGauge } from "./RadialGauge";

/* ---------- Hazard parameter slider ---------- */

interface HazardSliderProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
  color: string;
  description: string;
}

function HazardSlider({ icon, label, value, min, max, step, unit, onChange, color, description }: HazardSliderProps) {
  return (
    <div className="group space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("flex size-7 items-center justify-center rounded-md", color)}>
            {icon}
          </div>
          <div>
            <span className="text-sm font-medium leading-none">{label}</span>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{description}</p>
          </div>
        </div>
        <span className="font-mono-num text-sm font-bold tabular-nums text-foreground">
          {value.toFixed(step < 1 ? 1 : 0)}
          <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{unit}</span>
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="slider-neumorphic"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ---------- Cost readout ---------- */

function CostReadout({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-chart-5/10">
        <DollarSign className="size-5 text-chart-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Estimated Cost
        </p>
        <p className="font-mono-num text-xl font-bold tabular-nums text-foreground leading-tight">
          {value > 0 ? `${value}M` : "—"}
          <span className="ml-1 text-xs font-normal text-muted-foreground">VUV</span>
        </p>
      </div>
      <TrendingUp className={cn("size-4", value > 200 ? "text-red-500" : value > 50 ? "text-amber-500" : "text-emerald-500")} />
    </div>
  );
}

/* ---------- Status indicator ---------- */

function StatusDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex size-2.5">
      {active && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
      <span className={cn("relative inline-flex size-2.5 rounded-full", active ? "bg-emerald-500" : "bg-muted-foreground/30")} />
    </span>
  );
}

/* ---------- Main panel ---------- */

export function SimulationPanel() {
  const {
    isOpen,
    setIsOpen,
    seaLevelRise,
    setSeaLevelRise,
    cycloneIntensity,
    setCycloneIntensity,
    floodDepth,
    setFloodDepth,
    earthquakeMagnitude,
    setEarthquakeMagnitude,
    populationAtRisk,
    infrastructureDamage,
    cropLoss,
    estimatedCost,
    isRunning,
    runSimulation,
    resetAll,
  } = useSimulationStore();

  const handleRun = useCallback(() => runSimulation(), [runSimulation]);
  const handleReset = useCallback(() => resetAll(), [resetAll]);

  if (!isOpen) return null;

  return (
    <TooltipProvider>
        <div
        className={cn(
          "absolute right-3 top-14 z-[1050] flex w-[min(340px,calc(100vw-1.5rem))] flex-col overflow-hidden md:right-4 md:top-16",
          "rounded-[var(--drmis-radius-card)] border border-border bg-card shadow-[var(--drmis-shadow-md)]",
          "animate-in fade-in-0 slide-in-from-right-4 duration-200",
        )}
      >
        {/* ---- Header ---- */}
        <div className="flex items-center gap-2.5 border-b border-border bg-card px-4 py-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Gauge className="size-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold leading-none">Simulation Control</h2>
              <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-medium uppercase tracking-wider">
                Beta
              </Badge>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Hazard scenario modelling</p>
          </div>
          <div className="flex items-center gap-1">
            <StatusDot active={isRunning} />
            <TooltipCompat content="Close panel">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </TooltipCompat>
          </div>
        </div>

        {/* ---- Body (scrollable) ---- */}
        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-4 py-4" style={{ maxHeight: "calc(100vh - 12rem)" }}>

          {/* Section: Hazard Parameters */}
          <div>
            <div className="mb-3 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hazard Parameters
              </span>
            </div>

            <div className="space-y-5">
              <HazardSlider
                icon={<Waves className="size-3.5 text-sky-600 dark:text-sky-400" />}
                label="Sea Level Rise"
                description="Projected rise above current mean"
                value={seaLevelRise}
                min={0}
                max={3}
                step={0.1}
                unit="m"
                onChange={setSeaLevelRise}
                color="bg-sky-500/10"
              />
              <HazardSlider
                icon={<Activity className="size-3.5 text-violet-600 dark:text-violet-400" />}
                label="Cyclone Intensity"
                description="Saffir–Simpson scale (0 = none)"
                value={cycloneIntensity}
                min={0}
                max={5}
                step={1}
                unit="cat"
                onChange={setCycloneIntensity}
                color="bg-violet-500/10"
              />
              <HazardSlider
                icon={<CloudRain className="size-3.5 text-blue-600 dark:text-blue-400" />}
                label="Flood Depth"
                description="Peak inundation depth"
                value={floodDepth}
                min={0}
                max={5}
                step={0.5}
                unit="m"
                onChange={setFloodDepth}
                color="bg-blue-500/10"
              />
              <HazardSlider
                icon={<Zap className="size-3.5 text-amber-600 dark:text-amber-400" />}
                label="Earthquake Magnitude"
                description="Richter scale"
                value={earthquakeMagnitude}
                min={0}
                max={9}
                step={0.5}
                unit="M"
                onChange={setEarthquakeMagnitude}
                color="bg-amber-500/10"
              />
            </div>
          </div>

          <Separator />

          {/* Section: Impact Gauges */}
          <div>
            <div className="mb-3 flex items-center gap-1.5">
              <Activity className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Impact Assessment
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <RadialGauge
                value={populationAtRisk}
                label="Population at Risk"
                icon={<Users className="size-3.5" />}
              />
              <RadialGauge
                value={infrastructureDamage}
                label="Infrastructure"
                icon={<Building2 className="size-3.5" />}
              />
              <RadialGauge
                value={cropLoss}
                label="Crop Loss"
                icon={<Sprout className="size-3.5" />}
              />
            </div>
          </div>

          <Separator />

          {/* Section: Cost estimate */}
          <CostReadout value={estimatedCost} />
        </div>

        {/* ---- Footer ---- */}
        <div className="flex items-center gap-2 border-t border-border bg-card px-4 py-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className={cn(
              "download-accent-pill flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="size-4" />
                Run Simulation
              </>
            )}
          </button>
          <TooltipCompat content="Reset all parameters">
            <button
              type="button"
              onClick={handleReset}
              className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="size-4" />
            </button>
          </TooltipCompat>
        </div>
      </div>
    </TooltipProvider>
  );
}
