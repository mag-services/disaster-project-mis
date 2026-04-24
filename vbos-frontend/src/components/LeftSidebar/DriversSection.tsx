/**
 * Drivers overlay: Population growth, Roads, Urban expansion.
 * Shown in climate mode. Uses "Drivers" cluster when available.
 */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { LayerSwitch } from "./LayerSwitch";
import { useClusterDatasets } from "@/hooks/useClusters";
import { LuRoute, LuUsers, LuBuilding2 } from "react-icons/lu";
import { DRIVER_LAYER_NAMES } from "@/config/drivers";

const DRIVER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "Population growth": LuUsers,
  Roads: LuRoute,
  "Urban expansion": LuBuilding2,
};

export function DriversSection() {
  const { data: clusterData, isPending } = useClusterDatasets("Drivers", {
    enabled: true,
  });

  const driverDatasets = clusterData?.flatMap((tg) => tg.datasets) ?? [];
  const availableDatasets = DRIVER_LAYER_NAMES.flatMap((name) => {
    const found = driverDatasets.find(
      (d) => d.name?.toLowerCase().includes(name.toLowerCase()),
    );
    return found ? [{ name, dataset: found }] : [];
  });

  return (
    <Accordion type="multiple" className="mt-3">
      <AccordionItem
        value="drivers"
        className="rounded-lg border border-border bg-muted/30"
      >
        <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline rounded-md [&[data-state=open]]:rounded-b-none">
          <div className="flex flex-col items-start gap-0.5 text-left">
            <span>Drivers overlay</span>
            <span className="text-[10px] font-normal text-muted-foreground">
              Contextual layers — population, roads, urban expansion
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 pt-0">
          {isPending ? (
            <div className="space-y-2 py-2" role="status" aria-label="Loading drivers">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : availableDatasets.length > 0 ? (
            <div className="flex flex-col gap-2 pt-1">
              {availableDatasets.map(({ name, dataset }) => {
                const Icon = DRIVER_ICONS[name];
                return (
                  <div key={`${dataset.dataType}-${dataset.id}`} className="flex items-center gap-2">
                    {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
                    <LayerSwitch
                      dataType={dataset.dataType}
                      id={dataset.id}
                      title={dataset.name}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-3 text-xs text-muted-foreground">
              Population growth, Roads, Urban expansion. Add datasets with these names (in any cluster, e.g. Roads in Logistics) to enable overlays.
            </p>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
