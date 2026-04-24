/**
 * Displays datasets for a chosen cluster. Shown below the cluster dropdown.
 * In Climate mode, shows Land Cover | Datasets tabs.
 * When a climate module is selected, only shows datasets relevant to that module.
 */
import { useState, useMemo } from "react";
import { Accordion } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatasetSection } from "./DatasetSection";
import { useClusterDatasets } from "@/hooks/useClusters";
import { useScenario } from "@/hooks/useScenario";
import { useUiStore } from "@/store/ui-store";
import { isLayerAllowed, isClusterTypeAllowed } from "@/config/scenarios";
import {
  isDatasetForClimateModule,
  CLIMATE_MODULES_WITH_LAYERS,
  type ClimateModuleId,
} from "@/config/climate";

type SelectedClusterPanelProps = {
  clusterName: string;
};

export function SelectedClusterPanel({ clusterName }: SelectedClusterPanelProps) {
  const scenario = useScenario();
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const [layerTab, setLayerTab] = useState<"land_cover" | "datasets">("land_cover");
  const { data: clusterDatasets, isPending, error } = useClusterDatasets(
    clusterName,
    { enabled: true },
  );

  const filteredTypeGroups = useMemo(() => {
    let result = clusterDatasets ?? [];
    result = result
      .filter((tg) => isClusterTypeAllowed(scenario, tg.type))
      .map((tg) => ({
        ...tg,
        datasets: tg.datasets
          .filter((d) => isLayerAllowed(scenario, d.dataType))
          .filter((d) => d.dataType !== "tabular"),
      }))
      .filter((tg) => tg.datasets.length > 0);
    return result;
  }, [clusterDatasets, scenario]);

  const isClimate = scenario.uiConfig.sidebarLayout === "climate";

  /** In climate mode: filter datasets by selected module. land_use→Land cover only, coastal→Coastal shorelines only, others→empty. */
  const moduleFilteredGroups = useMemo(() => {
    if (!isClimate || !selectedClimateModule) return null;
    const moduleId = selectedClimateModule as ClimateModuleId;
    if (!CLIMATE_MODULES_WITH_LAYERS.includes(moduleId)) {
      return []; // flood_risk, indicators, etc. → no datasets
    }
    return filteredTypeGroups
      .map((tg) => ({
        ...tg,
        datasets: tg.datasets.filter((d) => isDatasetForClimateModule(moduleId, d)),
      }))
      .filter((tg) => tg.datasets.length > 0);
  }, [isClimate, selectedClimateModule, filteredTypeGroups]);

  const rasterGroups = useMemo(
    () => filteredTypeGroups.filter((tg) => tg.datasets.some((d) => d.dataType === "raster")),
    [filteredTypeGroups],
  );
  const otherGroups = useMemo(
    () => filteredTypeGroups.filter((tg) => !tg.datasets.some((d) => d.dataType === "raster")),
    [filteredTypeGroups],
  );
  const displayGroups = useMemo(() => {
    if (moduleFilteredGroups !== null) return moduleFilteredGroups;
    return isClimate && layerTab === "land_cover"
      ? rasterGroups
      : isClimate && layerTab === "datasets"
        ? otherGroups
        : filteredTypeGroups;
  }, [moduleFilteredGroups, isClimate, layerTab, rasterGroups, otherGroups, filteredTypeGroups]);

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      <div className="px-2 pb-3 pt-2">
        {error ? (
          <div className="rounded-lg p-4 text-sm text-amber-600 dark:text-amber-400">
            Error loading data: {String(error)}
          </div>
        ) : isPending ? (
          <div className="space-y-2 px-2 py-2" role="status" aria-label="Loading datasets">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <Skeleton className="mb-2 h-4 w-24" />
                <div className="space-y-1.5 pl-1">
                  <Skeleton className="h-3.5 w-[85%]" />
                  <Skeleton className="h-3.5 w-[70%]" />
                </div>
              </div>
            ))}
          </div>
        ) : displayGroups?.length === 0 ? (
          <p className="px-2 py-4 text-xs text-muted-foreground">
            {isClimate &&
            selectedClimateModule &&
            !CLIMATE_MODULES_WITH_LAYERS.includes(selectedClimateModule as ClimateModuleId)
              ? "Coming soon."
              : "No map layers in this cluster. Tabular data appears in the right panel."}
          </p>
        ) : (
          <>
            {isClimate && moduleFilteredGroups === null && (
              <Tabs
                value={layerTab}
                onValueChange={(v) => setLayerTab(v as "land_cover" | "datasets")}
                className="mb-3"
              >
                <TabsList className="h-8 w-full bg-muted/50 p-0.5">
                  <TabsTrigger value="land_cover" className="flex-1 text-xs">
                    Land cover
                  </TabsTrigger>
                  <TabsTrigger value="datasets" className="flex-1 text-xs">
                    Datasets
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
            <Accordion type="multiple" defaultValue={filteredTypeGroups?.map((t) => t.type) ?? []} className="space-y-1">
            {displayGroups?.map((item) => (
              <DatasetSection
                key={item.type}
                title={item.type}
                datasets={item.datasets}
              />
            ))}
          </Accordion>
          </>
        )}
      </div>
    </div>
  );
}
