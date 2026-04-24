/**
 * When a climate module is selected, auto-enable all map layers (vector, raster, pmtiles)
 * for that module. Runs only in Climate mode.
 */
import { useEffect } from "react";
import { useViewStore } from "@/store/view-store";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore } from "@/store/ui-store";
import { useClusterDatasets } from "@/hooks/useClusters";
import {
  getClusterForClimateModule,
  CLIMATE_MODULES,
  CLIMATE_MODULES_WITH_LAYERS,
  type ClimateModuleId,
} from "@/config/climate";
import { isLayerAllowed } from "@/config/scenarios";
import { useScenario } from "@/hooks/useScenario";

export function useClimateModuleAutoLayers() {
  const scenarioId = useViewStore((s) => s.scenarioId);
  const selectedClimateModule = useUiStore((s) => s.selectedClimateModule);
  const setSelectedClimateModule = useUiStore((s) => s.setSelectedClimateModule);
  const { setLayers } = useLayerStore();
  const scenario = useScenario();

  // When entering Climate mode, default to first module (LeftSidebar is hidden)
  useEffect(() => {
    if (scenarioId === "climate" && !selectedClimateModule && CLIMATE_MODULES.length > 0) {
      setSelectedClimateModule(CLIMATE_MODULES[0].id);
    }
  }, [scenarioId, selectedClimateModule, setSelectedClimateModule]);

  const cluster =
    scenarioId === "climate" && selectedClimateModule
      ? getClusterForClimateModule(selectedClimateModule as ClimateModuleId)
      : null;

  const { data } = useClusterDatasets(cluster ?? "", {
    enabled: scenarioId === "climate" && !!selectedClimateModule && !!cluster,
  });

  useEffect(() => {
    if (scenarioId !== "climate" || !selectedClimateModule || !data) return;

    const moduleId = selectedClimateModule as ClimateModuleId;
    if (!CLIMATE_MODULES_WITH_LAYERS.includes(moduleId)) {
      setLayers("");
      return;
    }

    const layerIds: string[] = [];
    for (const group of data) {
      for (const d of group.datasets) {
        if (d.dataType === "tabular") continue;
        if (!isLayerAllowed(scenario, d.dataType)) continue;
        const prefix = d.dataType === "vector" ? "v" : d.dataType === "raster" ? "r" : d.dataType === "pmtiles" ? "p" : null;
        if (prefix) layerIds.push(`${prefix}${d.id}`);
      }
    }
    setLayers(layerIds.join(","));
  }, [scenarioId, selectedClimateModule, data, setLayers, scenario]);
}
