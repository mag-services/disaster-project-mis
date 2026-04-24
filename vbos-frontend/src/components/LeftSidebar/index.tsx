import { useEffect } from "react";
import { LuLayers } from "react-icons/lu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "../Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useClusters } from "@/hooks/useClusters";
import { useLayerStore } from "@/store/layer-store";
import { useScenario } from "@/hooks/useScenario";
import { useViewStore } from "@/store/view-store";
import { useUiStore } from "@/store/ui-store";
import { SelectedClusterPanel } from "./SelectedClusterPanel";
import { DriversSection } from "./DriversSection";
import { DisasterSection } from "./DisasterSection";
import { CycloneNameBanner } from "./CycloneNameBanner";
import { ClimateModuleSelect } from "./ClimateModuleSelect";
import { ActiveLayersList } from "./ActiveLayersList";
import { DISASTER_VIEW_TYPES } from "@/store/ui-store";
import { CLIMATE_MODULES, getClusterForClimateModule } from "@/config/climate";

const LeftSidebar = () => {
  const scenario = useScenario();
  const scenarioId = useViewStore((s) => s.scenarioId);
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const setSelectedClimateModule = useUiStore((s) => s.setSelectedClimateModule);
  const {
    data: clusters,
    isPending: clustersLoading,
    error: clustersError,
  } = useClusters();
  const { layers } = useLayerStore();
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const setSelectedCluster = useUiStore((s) => s.setSelectedCluster);
  const selectedViewType = useUiStore((s) => s.selectedViewType);

  const activeLayerCount = layers ? layers.split(",").filter(Boolean).length : 0;

  useEffect(() => {
    if (clusters?.length && !selectedCluster) {
      setSelectedCluster(clusters[0].name);
    }
  }, [clusters, selectedCluster, setSelectedCluster]);

  const effectiveCluster =
    scenarioId === "climate"
      ? getClusterForClimateModule((selectedClimateModule || "land_use") as "land_use" | "coastal")
      : selectedCluster;

  useEffect(() => {
    if (scenarioId === "climate" && !selectedClimateModule && CLIMATE_MODULES.length > 0) {
      setSelectedClimateModule(CLIMATE_MODULES[0].id);
    }
  }, [scenarioId, selectedClimateModule, setSelectedClimateModule]);

  const collapsedIcons = (onExpand: () => void) => (
    <button
      type="button"
      onClick={onExpand}
      className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Open data layers"
    >
      <LuLayers className="size-4" />
    </button>
  );

  if (clustersError) {
    return (
      <Sidebar direction="left" title="Data Layers" transparent>
        <div className="p-4 text-sm text-amber-600 dark:text-amber-400">
          Error loading data: {String(clustersError)}
        </div>
      </Sidebar>
    );
  }

  if (clustersLoading) {
    return (
      <Sidebar direction="left" title="Data Layers" transparent>
        <div className="space-y-3 px-2 py-3" role="status" aria-label="Loading clusters">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
              <Skeleton className="mb-3 h-5 w-[140px]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
            </div>
          ))}
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar
      direction="left"
      title="Data Layers"
      badgeCount={activeLayerCount}
      subtitle={scenario.uiConfig.sidebarLayout === "climate" ? "Baseline datasets only" : undefined}
      collapsedIcons={collapsedIcons}
      transparent
    >
      <div className="space-y-3 border-b border-border px-4 py-3 max-md:space-y-4 max-md:py-4 md:px-5 md:py-3">
        {scenarioId === "climate" ? (
          <div data-tour="climate-module">
            <ClimateModuleSelect />
          </div>
        ) : (
          <Select value={selectedCluster} onValueChange={setSelectedCluster}>
            <SelectTrigger data-tour="cluster-select" className="w-full rounded-md border-border bg-muted/50">
              <SelectValue placeholder="Select cluster..." />
            </SelectTrigger>
            <SelectContent>
              {clusters?.map((cluster) => (
                <SelectItem key={cluster.id} value={cluster.name}>
                  {cluster.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div data-tour="datasets-list" className="scrollbar-thin flex-1 overflow-y-auto py-3 px-4 max-md:py-4 max-md:px-4 max-md:text-sm md:py-4 md:px-5">
        <CycloneNameBanner />
        {scenarioId === "climate" ? (
          <>
            {effectiveCluster && <SelectedClusterPanel clusterName={effectiveCluster} />}
            <DriversSection />
          </>
        ) : effectiveCluster ? (
          <>
            <SelectedClusterPanel clusterName={effectiveCluster} />
            {selectedViewType &&
              DISASTER_VIEW_TYPES.includes(selectedViewType) && <DisasterSection />}
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Select a cluster above to view datasets
          </p>
        )}
      </div>
      <ActiveLayersList />
    </Sidebar>
  );
};

export { LeftSidebar };
