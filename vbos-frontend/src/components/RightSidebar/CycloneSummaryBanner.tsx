/**
 * Compact banner showing highest cyclone intensity for the selected area.
 * Appears near Area Select when province/area council is selected and a cyclone layer is active.
 */
import { LuWind } from "react-icons/lu";
import { useCycloneIntensityData } from "@/hooks/useCycloneIntensityData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CycloneSummaryBanner() {
  const data = useCycloneIntensityData();

  if (!data) return null;
  if (data.isLoading) {
    return (
      <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-950/30">
        <Skeleton className="h-5 w-3/4" />
      </div>
    );
  }
  if (!data.hasData || !data.maxIntensity) return null;

  const { cycloneName, maxIntensity } = data;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2",
        "border-amber-200/60 bg-amber-50/50 dark:border-amber-800/40 dark:bg-amber-950/30",
      )}
      role="status"
      aria-label={`Cyclone intensity: ${maxIntensity.label} affecting this area`}
    >
      <LuWind className="size-4 shrink-0 text-amber-600 dark:text-amber-500" />
      <p className="text-xs leading-snug">
        <span className="font-semibold text-foreground">
          {cycloneName || "Cyclone"}
        </span>
        <span className="text-muted-foreground">: This area is facing </span>
        <span
          className="inline-flex items-center gap-1 font-semibold"
          style={{ color: maxIntensity.color }}
        >
          <span
            className="inline-block size-2 shrink-0 rounded-sm"
            style={{ backgroundColor: maxIntensity.color }}
          />
          {maxIntensity.label}
        </span>
        <span className="text-muted-foreground"> wind cyclones.</span>
      </p>
    </div>
  );
}
