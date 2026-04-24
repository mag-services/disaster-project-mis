/**
 * Disaster overlay: Cyclone Intensity, Volcano, Flood.
 * Shown in disaster mode when Data view is Damage, Resources, or Financial (not Baseline).
 * Uses "Disaster" cluster when available - fetches by name across all clusters.
 */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { LayerSwitch } from "./LayerSwitch";
import { useClusterDatasets } from "@/hooks/useClusters";
import {
  LuWind,
  LuFlame,
  LuDroplets,
  LuActivity,
  LuWaves,
  LuMountain,
  LuSun,
  LuFlameKindling,
} from "react-icons/lu";
import { DISASTER_LAYER_NAMES } from "@/config/disaster";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui";

const DISASTER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Cyclone Intensity": LuWind,
  Volcano: LuFlame,
  Flood: LuDroplets,
  Earthquake: LuActivity,
  Tsunami: LuWaves,
  Landslide: LuMountain,
  Drought: LuSun,
  Wildfire: LuFlameKindling,
};

export function DisasterSection() {
  const { data: clusterData, isPending } = useClusterDatasets("Disaster", {
    enabled: true,
    replace: false, // Merge disaster overlays; don't replace selected cluster's tabular
  });

  const disasterDatasets = clusterData?.flatMap((tg) => tg.datasets) ?? [];
  const hazardRows = DISASTER_LAYER_NAMES.map((name) => {
    const dataset = disasterDatasets.find(
      (d) => d.name?.toLowerCase().includes(name.toLowerCase()),
    );
    return { name, dataset };
  });

  return (
    <Accordion type="multiple" className="mt-3">
      <AccordionItem
        value="disaster"
        className="rounded-lg border border-border bg-muted/30"
      >
        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline rounded-md [&[data-state=open]]:rounded-b-none">
          <div className="flex flex-col items-start gap-0.5 text-left">
            <span>Disaster overlay</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              Hazard footprints — cyclone, volcano, flood, earthquake
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-0">
          {isPending ? (
            <div className="space-y-2 py-2" role="status" aria-label="Loading disaster overlays">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              {hazardRows.map(({ name, dataset }) => {
                const Icon = DISASTER_ICONS[name];
                return (
                  <div key={name} className="flex items-center gap-2">
                    {Icon && (
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          dataset ? "text-muted-foreground" : "text-muted-foreground/50",
                        )}
                      />
                    )}
                    {dataset ? (
                      <LayerSwitch
                        dataType={dataset.dataType}
                        id={dataset.id}
                        title={dataset.name}
                      />
                    ) : (
                      <Tooltip
                        content="Upload dataset in Admin to enable"
                        positioning={{ placement: "top" }}
                      >
                        <label className="flex cursor-not-allowed items-center gap-2 opacity-50">
                          <Switch
                            id={`disaster-disabled-${name.replace(/\s+/g, "-")}`}
                            size="sm"
                            checked={false}
                            disabled
                          />
                          <span className="overflow-hidden text-ellipsis whitespace-pre font-normal">
                            {name}
                          </span>
                        </label>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
