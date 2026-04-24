/**
 * Single glass toolbar: Simulate, layer chip, Legend — aligned product chrome over the map.
 */
import { LuGauge } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useSimulationStore } from "@/store/simulation-store";
import { FloatingLayerControl } from "@/components/Map/FloatingLayerControl";
import { Legend } from "@/components/Map/Legend/Legend";
import { WorkspaceMenu } from "@/components/Map/WorkspaceMenu";
import { AssetHazardContextBanner } from "@/components/Map/AssetHazardContextBanner";

export function MapFloatingChrome() {
  const { isOpen: simOpen, setIsOpen: setSimOpen } = useSimulationStore();

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-3 right-3 top-3 z-[1040] md:left-4 md:right-auto",
        "drmis-panel-enter flex max-w-[min(100%,calc(100vw-1.5rem))] flex-col items-start",
      )}
    >
      <div
        className={cn(
          /* overflow-visible: layer dropdown is position:absolute below trigger; overflow-hidden clipped it */
          "pointer-events-auto inline-flex max-w-full flex-wrap items-stretch overflow-visible rounded-[var(--drmis-radius-card)] border border-border",
          "bg-card/80 shadow-[var(--drmis-shadow-sm)] backdrop-blur-md backdrop-saturate-150",
        )}
        role="toolbar"
        aria-label="Map controls"
      >
        <Tooltip
          content="Run a scenario simulation using current layer settings"
          positioning={{ placement: "bottom" }}
          contentProps={{ className: "max-w-[16rem] text-balance" }}
        >
          <Button
            type="button"
            variant={simOpen ? "secondary" : "ghost"}
            size="sm"
            className={cn(
              "drmis-touch-target h-11 min-h-11 shrink-0 rounded-none border-0 px-3 shadow-none md:min-h-11",
              simOpen && "bg-primary/10 ring-1 ring-primary/25",
            )}
            onClick={() => setSimOpen(!simOpen)}
            aria-label="Simulate: open scenario controls"
            aria-pressed={simOpen}
          >
            <LuGauge className="size-5 shrink-0 md:size-4" />
            <span className="ml-1.5 hidden text-xs font-medium sm:inline">Simulate</span>
          </Button>
        </Tooltip>
        <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
        <FloatingLayerControl chrome />
        <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
        <Legend variant="chrome" />
        <div className="w-px shrink-0 self-stretch bg-border" aria-hidden />
        <WorkspaceMenu chrome />
      </div>
      <AssetHazardContextBanner />
    </div>
  );
}
