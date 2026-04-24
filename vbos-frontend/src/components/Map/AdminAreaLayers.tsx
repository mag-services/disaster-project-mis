import { GeoJSON } from "react-leaflet";
import { useUiStore } from "@/store/ui-store";
import { featureCollection } from "@turf/helpers";
import L from "leaflet";
import useProvinces from "@/hooks/useProvinces";
import { useAreaStore } from "@/store/area-store";
import { useDeferredArea } from "@/hooks/useDeferredArea";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { useAdminAreaStats } from "@/hooks/useAdminAreaStats";
import { useHasDisasterLayerActive } from "@/hooks/useHasDisasterLayerActive";
import { useComparisonStore } from "@/store/comparison-store";
import { MAP_COLORS, getChoroplethColor } from "../colors";
import { abbreviateUnit } from "@/utils/abbreviateUnit";
import { useColorMode } from "../ui/color-mode";
import type { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";
import type { PopupInfo } from "./index";

type AdminAreaMapLayersProps = {
  setPopupInfo: (info: PopupInfo | null) => void;
  activeFeatureName?: string;
};

const EMPTY_GEOJSON = featureCollection([]) as ProvincesGeoJSON;

/** Fallback unit when dataset has unit="number" or no unit. Infer from cluster or dataset name. */
function inferTooltipUnit(
  metadata: { cluster?: string | null; name?: string } | undefined,
): string | undefined {
  if (!metadata) return undefined;
  const cluster = (metadata.cluster ?? "").toLowerCase();
  const name = (metadata.name ?? "").toLowerCase();

  const clusterUnits: Record<string, string> = {
    business: "businesses",
    "emergency telecommunications": "towers",
    education: "schools",
    health: "facilities",
    shelter: "households",
    "food security": "households",
    energy: "households",
    wash: "households",
    logistics: "km",
    "gender & protection": "people",
  };
  const unit = clusterUnits[cluster];
  if (unit) return unit;

  if (name.includes("tower")) return "towers";
  if (name.includes("school")) return "schools";
  if (name.includes("facility") || name.includes("health")) return "facilities";
  if (name.includes("household")) return "households";
  if (name.includes("business")) return "businesses";
  if (name.includes("road") || name.includes("km")) return "km";
  return undefined;
}

export function AdminAreaMapLayers({
  setPopupInfo,
  activeFeatureName,
}: AdminAreaMapLayersProps) {
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const setMapHoverFeature = useUiStore((s) => s.setMapHoverFeature);
  const { comparisonMode } = useComparisonStore();
  const hasDisasterLayerActive = useHasDisasterLayerActive();
  const { data: provincesGeojson, isPending, error } = useProvinces();
  const { provinces, acList } = useDeferredArea();
  const acGeoJSON = useAreaStore((s) => s.acGeoJSON);
  const { layers, getLayerMetadata } = useLayerStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const adminAreaGeoJSON: ProvincesGeoJSON | AreaCouncilGeoJSON =
    provinces.length > 0 && acGeoJSON.features.length > 0
      ? acGeoJSON
      : (provincesGeojson ?? EMPTY_GEOJSON);
  const {
    geojson: adminAreaStatsGeojson,
    maxValue,
    minValue,
  } = useAdminAreaStats(adminAreaGeoJSON);

  if (isPending || error) {
    return null;
  }

  const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
  const activeTabularLayerId = tabularLayers.length ? tabularLayers[0] : null;
  const tabularMetadata = activeTabularLayerId ? getLayerMetadata(activeTabularLayerId) : undefined;
  const tooltipUnit =
    tabularMetadata?.unit && tabularMetadata.unit !== "number"
      ? abbreviateUnit(tabularMetadata.unit)
      : inferTooltipUnit(tabularMetadata);
  const tabularOpacity = activeTabularLayerId
    ? getEffectiveOpacity(activeTabularLayerId, getOpacity(activeTabularLayerId) / 100)
    : 1;

  const getProvinceStyle = (_feature?: GeoJSON.Feature) => {
    // When a province is selected, hide province borders to avoid overlapping shoreline/coastal lines.
    // Map still zooms to the selected province (handled in Map/index.tsx).
    if (provinces.length > 0) {
      return {
        color: mapPalette.provinceBorder,
        weight: 1,
        opacity: 0,
        fill: false,
        fillOpacity: 0,
      };
    }
    return {
      color: mapPalette.provinceBorder,
      weight: acList.length > 0 ? 1 : 2,
      opacity: acList.length > 0 ? 0.5 : 1,
      fill: false,
      fillOpacity: 0,
    };
  };

  const getAreaCouncilStyle = (feature?: GeoJSON.Feature) => {
    const name = feature?.properties?.name as string | undefined;
    const show =
      acList.length === 0 ||
      (name && acList.some((a) => name.toLowerCase() === a.toLowerCase()));
    return {
      color: mapPalette.areaCouncilBorder,
      weight: acList.length > 0 ? 2 : 1.5,
      opacity: acList.length > 0 ? 1 : show ? 0.5 : 0,
      fill: false,
      fillOpacity: 0,
    };
  };

  const getStatsStyle = (feature?: GeoJSON.Feature) => {
    const value = feature?.properties?.value as number | undefined;
    const name = feature?.properties?.name as string | undefined;
    const nameInAcList =
      !name ||
      acList.length === 0 ||
      acList.some((a) => name.toLowerCase() === a.toLowerCase());
    if (typeof value !== "number" || !isFinite(value) || !nameInAcList) {
      return { fillOpacity: 0, stroke: false };
    }
    const t = maxValue !== minValue
      ? (value - minValue) / (maxValue - minValue)
      : 1;
    const fillColor = getChoroplethColor(t, mapPalette);
    const opacity = maxValue !== minValue ? 0.25 + t * 0.45 : 0.7;
    const isActive = activeFeatureName && name?.toLowerCase() === activeFeatureName.toLowerCase();
    return {
      fillColor,
      fillOpacity: tabularOpacity * opacity,
      color: isActive ? mapPalette.choroplethLow : fillColor,
      weight: isActive ? 4 : 1,
      opacity: isActive ? 1 : 0.7,
      className: isActive ? "selected-map-feature" : undefined,
    };
  };

  const hoverHandlers = {
    mouseover: () => setMapHoverFeature(true),
    mouseout: () => setMapHoverFeature(false),
  };

  const buildStatsTooltip = (props: Record<string, unknown>, unit?: string | null) => {
    const name = props.name as string | undefined;
    const value = props.value as number | undefined;
    const lines: string[] = [];
    if (name) lines.push(`<strong>${name}</strong>`);
    if (typeof value === "number" && isFinite(value)) {
      const formatted = value.toLocaleString(undefined, { maximumFractionDigits: 1 });
      lines.push(unit ? `${formatted} ${unit}` : formatted);
    }
    return lines.length ? lines.join("<br/>") : null;
  };

  const onEachStatsFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const tooltipContent = buildStatsTooltip(feature.properties || {}, tooltipUnit);
    if (tooltipContent) {
      (layer as L.Path).bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
        className: "admin-area-tooltip",
        offset: [0, -4],
        opacity: 0.95,
        interactive: false,
      });
    }
    layer.on({
      ...hoverHandlers,
      click: (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
        const metadata = tabularLayers.length ? getLayerMetadata(tabularLayers[0]) : undefined;
        setPopupInfo({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
          properties: feature.properties || {},
          datasetName: metadata?.name,
          datasetId: tabularLayers[0] || "",
        });
      },
    });
  };

  const onEachBoundaryFeature = (feature: GeoJSON.Feature, layer: L.Layer) => {
    const name = (feature.properties?.name as string) || "Area";
    (layer as L.Path).bindTooltip(`<strong>${name}</strong>`, {
      permanent: false,
      direction: "top",
      className: "admin-area-tooltip",
      offset: [0, -4],
      opacity: 0.95,
      interactive: false,
    });
    layer.on(hoverHandlers);
  };

  return (
    <>
      {acGeoJSON && (
        <GeoJSON
          key="area-councils"
          data={acGeoJSON}
          style={getAreaCouncilStyle}
          onEachFeature={(feat, layer) => onEachBoundaryFeature(feat, layer)}
        />
      )}
      {provincesGeojson && (
        <GeoJSON
          key="provinces"
          data={provincesGeojson}
          style={getProvinceStyle}
          onEachFeature={(feat, layer) => onEachBoundaryFeature(feat, layer)}
        />
      )}
      {!comparisonMode &&
      activeTabularLayerId &&
      !hasDisasterLayerActive &&
      adminAreaStatsGeojson.features.length > 0 &&
      (maxValue !== 0 || minValue !== 0) && (
        <GeoJSON
          key="stats"
          data={adminAreaStatsGeojson}
          style={getStatsStyle}
          onEachFeature={onEachStatsFeature}
        />
      )}
    </>
  );
}
