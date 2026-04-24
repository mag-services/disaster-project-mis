/**
 * Hook for preparing legend data from active map layers.
 *
 * This hook reads metadata from the layer store
 * since the metadata is already loaded by the left sidebar.
 *
 * Architecture:
 * - Reads active layer IDs from the layer store (URL-synced)
 * - Gets metadata from the store's allDatasets
 * - Enriches with visualization metadata (colors, data ranges, etc.)
 * - Returns array of LegendLayer objects ready for display
 */

import { useQueryClient } from "@tanstack/react-query";
import { useLayerStore } from "@/store/layer-store";
import { useDateStore } from "@/store/date-store";
import type {
  LegendLayer,
  VectorLegendLayer,
} from "@/components/Map/Legend/types";
import type { PaginatedVectorData } from "@/types/api";
import { MAP_COLORS, VECTOR_LAYER_COLORS, VECTOR_CLUSTER_COLORS } from "../../../colors";
import { useColorMode } from "../../../ui/color-mode";
import { getVectorIconKey } from "../../vectorIcons";

/**
 * Hook that provides legend layer data for all currently active map layers.
 *
 * @returns Array of LegendLayer objects, or empty array if no layers active
 *
 * @example
 * ```tsx
 * function MapComponent() {
 *
 *   return (
 *     <Map>
 *       <Legend />
 *     </Map>
 *   );
 * }
 * ```
 */
export function useLegendLayers(): LegendLayer[] {
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const { layers: layerString, getLayerMetadata } = useLayerStore();
  const { year: dataYear } = useDateStore();
  const queryClient = useQueryClient();

  // Parse active layer IDs from the store
  const activeLayerIds = layerString
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const vectorLayerIds = activeLayerIds.filter((id) => id.startsWith("v"));

  // Build legend layers from the store metadata
  const legendLayers: LegendLayer[] = [];

  activeLayerIds.forEach((layerId) => {
    // Get metadata from the store
    const dataset = getLayerMetadata(layerId);

    // Only include layers that have metadata loaded
    // Tabular: context/sidebar only, never in map legend
    if (dataset && dataset.dataType !== "tabular") {
      if (dataset.dataType === "vector") {
        const vectorDataQueryKey = ["dataset", "vector", dataset.id, ""];

        const vectorData =
          queryClient.getQueryData<PaginatedVectorData>(vectorDataQueryKey);
        const geometryType: VectorLegendLayer["geometryType"] =
          (vectorData?.features[0]?.geometry
            .type as VectorLegendLayer["geometryType"]) || "LineString";

        const colorIndex = vectorLayerIds.indexOf(layerId);
        const cluster = dataset.cluster;
        const datasetColor =
          dataset && "color" in dataset && dataset.color ? dataset.color : undefined;
        const layerColor =
          datasetColor ??
          (cluster && VECTOR_CLUSTER_COLORS[cluster.toLowerCase().trim()]) ??
          VECTOR_LAYER_COLORS[colorIndex % VECTOR_LAYER_COLORS.length];
        const iconKey = getVectorIconKey(
          colorIndex,
          cluster,
          dataset && "icon" in dataset ? dataset.icon : undefined,
        );

        legendLayers.push({
          ...dataset,
          geometryType,
          color: layerColor,
          iconKey,
        });
      } else if (dataset.dataType === "raster") {
        legendLayers.push({
          ...dataset,
          opacity: 1.0,
          dataYear,
        });
      } else if (dataset.dataType === "pmtiles") {
        legendLayers.push({
          ...dataset,
          geometryType: "LineString",
          color: mapPalette.areaCouncilBorder,
          dataYear,
        });
      }
    }
  });

  return legendLayers;
}
