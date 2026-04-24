/**
 * Difference heatmap: single map colored by delta (yearRight - yearLeft) or % change.
 * Only shown when tabular is on map (no disaster layer active).
 */
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useComparisonStore } from "@/store/comparison-store";
import { useHasDisasterLayerActive } from "@/hooks/useHasDisasterLayerActive";
import { useLayerStore } from "@/store/layer-store";
import { useAreaStore } from "@/store/area-store";
import useProvinces from "@/hooks/useProvinces";
import { useAdminAreaStatsDelta } from "@/hooks/useAdminAreaStatsDelta";
import { useOpacityStore } from "@/store/opacity-store";
import { MAP_COLORS, getDeltaColor } from "../colors";
import { useColorMode } from "../ui/color-mode";
import { featureCollection } from "@turf/helpers";
import type { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";

export function TabularDeltaOverlay() {
  const map = useMap();
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const layerRef = useRef<L.GeoJSON | null>(null);

  const { comparisonMode, comparisonView, yearLeft, yearRight } = useComparisonStore();
  const { layers } = useLayerStore();
  const { acList, provinces, acGeoJSON } = useAreaStore();
  const { data: provincesGeojson } = useProvinces();
  const { getOpacity } = useOpacityStore();

  const adminAreaGeoJSON: ProvincesGeoJSON | AreaCouncilGeoJSON =
    provinces.length > 0 && acGeoJSON.features.length > 0
      ? acGeoJSON
      : (provincesGeojson ?? featureCollection([]) as ProvincesGeoJSON);

  const { geojson, minDelta, maxDelta } = useAdminAreaStatsDelta(
    adminAreaGeoJSON,
    yearLeft,
    yearRight,
    "percent",
  );

  const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
  const hasTabularLayer = tabularLayers.length > 0;
  const hasDisasterLayerActive = useHasDisasterLayerActive();
  const tabularOpacity = hasTabularLayer
    ? (getOpacity(tabularLayers[0]) ?? 100) / 100
    : 1;

  useEffect(() => {
    if (!comparisonMode || comparisonView !== "delta") return;
    if (hasTabularLayer && hasDisasterLayerActive) return;
    if (!geojson.features.length) return;

    const range = Math.max(Math.abs(maxDelta), Math.abs(minDelta), 1);
    const getStyle = (feature?: GeoJSON.Feature): L.PathOptions => {
      const delta = feature?.properties?.delta as number | undefined;
      const name = feature?.properties?.name as string | undefined;
      const nameInAcList =
        !name ||
        acList.length === 0 ||
        acList.some((a) => name.toLowerCase() === a.toLowerCase());
      if (typeof delta !== "number" || !isFinite(delta) || !nameInAcList) {
        return { fillOpacity: 0, stroke: false };
      }
      const t = range > 0 ? Math.max(-1, Math.min(1, delta / range)) : 0;
      const fillColor = getDeltaColor(t, mapPalette);
      return {
        fillColor,
        fillOpacity: tabularOpacity * 0.55,
        color: fillColor,
        weight: 1,
        opacity: 0.8,
      };
    };

    const layer = L.geoJSON(geojson as GeoJSON.GeoJSON, { style: getStyle });
    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [
    comparisonMode,
    comparisonView,
    hasTabularLayer,
    hasDisasterLayerActive,
    map,
    geojson,
    minDelta,
    maxDelta,
    tabularOpacity,
    acList,
    mapPalette,
  ]);

  return null;
}
