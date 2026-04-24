/**
 * Returns the current panel context based on user selection.
 * Drives context-aware panel content.
 */
import { useMemo } from "react";
import { useLayerStore } from "@/store/layer-store";
import { useUiStore } from "@/store/ui-store";
import { useViewStore } from "@/store/view-store";
import { useScenario } from "@/hooks/useScenario";
import { usePanelStore } from "@/store/panel-store";

export type PanelContextType =
  | "feature"   // Feature selected → drill-down insights
  | "tabular"  // Tabular layer → charts + KPIs
  | "raster"    // Raster layer → legend + opacity
  | "climate"   // Climate mode → land accounts
  | "empty";    // No relevant content

function clusterMatches(datasetCluster: string | null | undefined, selected: string): boolean {
  if (!selected) return false;
  return (datasetCluster ?? "").toLowerCase() === selected.toLowerCase();
}

export function usePanelContext() {
  const { layers, allDatasets } = useLayerStore();
  const selectedCluster = useUiStore((s) => s.selectedCluster);
  const scenarioId = useViewStore((s) => s.scenarioId);
  const scenario = useScenario();
  const selectedFeatureInfo = usePanelStore((s) => s.selectedFeatureInfo);

  const layerIds = layers.split(",").filter(Boolean);
  const hasRaster = layerIds.some((id) => id.startsWith("r"));
  const hasTabular = layerIds.some((id) => id.startsWith("t"));
  const hasVector = layerIds.some((id) => id.startsWith("v") || id.startsWith("p"));
  const isClimate = scenario.uiConfig.sidebarLayout === "climate";

  /** Selected cluster has tabular datasets (e.g. Business). Show right panel so user can pick province/area council. */
  const hasTabularInSelectedCluster = useMemo(() => {
    if (!selectedCluster || scenarioId === "climate") return false;
    return allDatasets.some(
      (d) =>
        d.dataType === "tabular" &&
        clusterMatches(d.cluster, selectedCluster),
    );
  }, [selectedCluster, allDatasets, scenarioId]);

  const context = useMemo((): PanelContextType => {
    if (selectedFeatureInfo) return "feature";
    if (isClimate) return "climate";
    if (hasTabular) return "tabular";
    if (hasRaster || hasVector) return "raster";
    return "empty";
  }, [selectedFeatureInfo, isClimate, hasTabular, hasRaster, hasVector]);

  return {
    context,
    hasRaster,
    hasTabular,
    hasVector,
    hasActiveLayers: layerIds.length > 0,
    isClimate,
    selectedFeatureInfo,
    hasTabularInSelectedCluster,
  };
}
