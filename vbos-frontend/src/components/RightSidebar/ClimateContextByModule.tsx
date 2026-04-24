/**
 * Climate context panel content by selected module.
 * One module at a time — no mixing. Land Use shows full content; others show coming soon.
 */
import { LuLeaf } from "react-icons/lu";
import { useUiStore } from "@/store/ui-store";
import { ImpactModeCard } from "./ImpactModeCard";
import { ComparisonMode } from "./ComparisonMode";
import { LandCoverTotalsChart } from "./LandCoverTotalsChart";
import { ClimateLayout } from "./ClimateLayout";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  land_use: "Land Use / Land Cover Classification",
  coastal: "Coastal changes",
  flood_risk: "Assessing Flood Risk from Past Weather",
  indicators: "Climate indicators",
  marine_heat: "Marine heat waves",
  coral_reef: "Coral reef mapping",
  soil_health: "Soil health",
};

function ComingSoon({ moduleLabel }: { moduleLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
      <LuLeaf className="mb-3 size-8 text-muted-foreground/60" />
      <p className="mb-1 text-sm font-semibold text-foreground">{moduleLabel}</p>
      <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
        This module is being refined. Select province and area council above to filter when data is available.
      </p>
    </div>
  );
}

export function ClimateContextByModule() {
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const rightSidebarExpanded = useUiStore((s) => s.rightSidebarExpanded);

  if (!selectedClimateModule) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
        <LuLeaf className="mb-3 size-8 text-muted-foreground/60" />
        <p className="mb-1 text-sm font-semibold text-foreground">Select a climate module</p>
        <p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
          Choose a module from the left panel to see charts and analysis here.
        </p>
      </div>
    );
  }

  if (selectedClimateModule === "land_use") {
    return (
      <div className="space-y-4">
        <ImpactModeCard />
        <div
          className={cn(
            "rounded-lg border border-border bg-muted/30 px-3 py-3",
            rightSidebarExpanded && "rounded-xl border-border/50 bg-card/80 px-4 py-4 shadow-sm",
          )}
        >
          <p className="mb-2 text-xs text-muted-foreground">
            Compare years (swipe or delta heatmap)
          </p>
          <ComparisonMode />
        </div>
        <LandCoverTotalsChart />
        <ClimateLayout />
      </div>
    );
  }

  return <ComingSoon moduleLabel={MODULE_LABELS[selectedClimateModule] ?? selectedClimateModule} />;
}
