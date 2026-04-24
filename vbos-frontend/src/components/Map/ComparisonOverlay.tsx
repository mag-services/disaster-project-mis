/**
 * Side-by-side year comparison overlay using leaflet-side-by-side.
 * Tabular comparison is shown on map when no disaster layer is active.
 * When a disaster layer (Cyclone Intensity, etc.) is active, tabular is right-panel only.
 */
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-side-by-side";
import { useComparisonStore } from "@/store/comparison-store";
import { useHasDisasterLayerActive } from "@/hooks/useHasDisasterLayerActive";
import { useLayerStore } from "@/store/layer-store";
import { useAreaStore } from "@/store/area-store";
import useProvinces from "@/hooks/useProvinces";
import { useAdminAreaStatsForYear } from "@/hooks/useAdminAreaStatsForYear";
import { useOpacityStore } from "@/store/opacity-store";
import { MAP_COLORS, getChoroplethColor } from "../colors";
import { useColorMode } from "../ui/color-mode";
import { featureCollection } from "@turf/helpers";
import type { AreaCouncilGeoJSON, ProvincesGeoJSON } from "@/types/data";

// leaflet-side-by-side adds L.control.sideBySide when imported
const sideBySide = (L.control as unknown as { sideBySide?: (left: L.Layer, right: L.Layer, opts?: { padding?: number }) => L.Control }).sideBySide;

type SideBySideControl = L.Control & { _divider?: HTMLDivElement };

function addSwipeLabels(
  map: L.Map,
  yearLeft: string,
  yearRight: string,
  control: SideBySideControl,
  opts: {
    minYear: number;
    maxYear: number;
    onYearLeftChange: (year: string) => void;
    onYearRightChange: (year: string) => void;
  },
): () => void {
  const clampYear = (value: number) => Math.max(opts.minYear, Math.min(opts.maxYear, value));
  const container = map.getContainer();
  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;top:12px;left:0;right:0;pointer-events:none;z-index:1000;display:flex;justify-content:space-between;align-items:center;padding:0 16px;gap:8px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.95);text-shadow:0 1px 2px rgba(0,0,0,0.5)";
  const leftSpan = document.createElement("div");
  leftSpan.style.cssText = "pointer-events:auto;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px)";
  const leftMinus = document.createElement("button");
  leftMinus.textContent = "−";
  leftMinus.style.cssText = "cursor:pointer;border:0;background:transparent;color:inherit;font-weight:700;line-height:1;padding:0 2px";
  leftMinus.title = "Previous baseline year";
  const leftText = document.createElement("span");
  leftText.textContent = `${yearLeft} (Baseline)`;
  const leftPlus = document.createElement("button");
  leftPlus.textContent = "+";
  leftPlus.style.cssText = "cursor:pointer;border:0;background:transparent;color:inherit;font-weight:700;line-height:1;padding:0 2px";
  leftPlus.title = "Next baseline year";
  leftSpan.appendChild(leftMinus);
  leftSpan.appendChild(leftText);
  leftSpan.appendChild(leftPlus);

  const centerSpan = document.createElement("span");
  centerSpan.textContent = "Drag handle to compare";
  centerSpan.style.cssText = "opacity:0.85";

  const rightSpan = document.createElement("div");
  rightSpan.style.cssText = "pointer-events:auto;display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px)";
  const rightMinus = document.createElement("button");
  rightMinus.textContent = "−";
  rightMinus.style.cssText = "cursor:pointer;border:0;background:transparent;color:inherit;font-weight:700;line-height:1;padding:0 2px";
  rightMinus.title = "Previous compare year";
  const rightText = document.createElement("span");
  rightText.textContent = `${yearRight} (Compare)`;
  const rightPlus = document.createElement("button");
  rightPlus.textContent = "+";
  rightPlus.style.cssText = "cursor:pointer;border:0;background:transparent;color:inherit;font-weight:700;line-height:1;padding:0 2px";
  rightPlus.title = "Next compare year";
  rightSpan.appendChild(rightMinus);
  rightSpan.appendChild(rightText);
  rightSpan.appendChild(rightPlus);

  hint.appendChild(leftSpan);
  hint.appendChild(centerSpan);
  hint.appendChild(rightSpan);
  container.style.position = "relative";
  container.appendChild(hint);

  const updateYear = (
    target: "left" | "right",
    delta: number,
    current: string,
  ) => {
    const currentN = Number.parseInt(current, 10);
    if (!Number.isFinite(currentN)) return;
    const next = clampYear(currentN + delta);
    if (target === "left") opts.onYearLeftChange(String(next));
    else opts.onYearRightChange(String(next));
  };

  leftMinus.onclick = (e) => {
    e.stopPropagation();
    updateYear("left", -1, yearLeft);
  };
  leftPlus.onclick = (e) => {
    e.stopPropagation();
    updateYear("left", 1, yearLeft);
  };
  rightMinus.onclick = (e) => {
    e.stopPropagation();
    updateYear("right", -1, yearRight);
  };
  rightPlus.onclick = (e) => {
    e.stopPropagation();
    updateYear("right", 1, yearRight);
  };

  const divider = control._divider;
  if (divider) {
    const yearDiv = document.createElement("div");
    yearDiv.className = "leaflet-sbs-year-divider";
    yearDiv.innerHTML = `<span>${yearLeft}</span><span>${yearRight}</span>`;
    divider.style.position = "relative";
    divider.appendChild(yearDiv);
  }

  return () => {
    hint.remove();
    const yd = divider?.querySelector(".leaflet-sbs-year-divider");
    if (yd) yd.remove();
  };
}

export function ComparisonOverlay() {
  const map = useMap();
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const controlRef = useRef<L.Control | null>(null);
  const leftLayerRef = useRef<L.GeoJSON | null>(null);
  const rightLayerRef = useRef<L.GeoJSON | null>(null);

  const {
    comparisonMode,
    comparisonView,
    yearLeft,
    yearRight,
    setYearLeft,
    setYearRight,
    minYear,
    maxYear,
  } = useComparisonStore();
  const { layers } = useLayerStore();
  const { acList, provinces, acGeoJSON } = useAreaStore();
  const { data: provincesGeojson } = useProvinces();
  const { getOpacity } = useOpacityStore();

  const adminAreaGeoJSON: ProvincesGeoJSON | AreaCouncilGeoJSON =
    provinces.length > 0 && acGeoJSON.features.length > 0
      ? acGeoJSON
      : (provincesGeojson ?? featureCollection([]) as ProvincesGeoJSON);

  const { geojson: geojsonLeft, minValue: minLeft, maxValue: maxLeft } =
    useAdminAreaStatsForYear(adminAreaGeoJSON, yearLeft);
  const { geojson: geojsonRight, minValue: minRight, maxValue: maxRight } =
    useAdminAreaStatsForYear(adminAreaGeoJSON, yearRight);

  const tabularLayers = layers.split(",").filter((i) => i.startsWith("t"));
  const hasTabularLayer = tabularLayers.length > 0;
  const hasDisasterLayerActive = useHasDisasterLayerActive();
  const tabularOpacity = hasTabularLayer
    ? (getOpacity(tabularLayers[0]) ?? 100) / 100
    : 1;

  useEffect(() => {
    // When disaster layer is active, tabular is right-panel only — no map comparison
    if (!comparisonMode || comparisonView !== "swipe" || (hasTabularLayer && hasDisasterLayerActive) || !sideBySide) return;
    if (!geojsonLeft.features.length && !geojsonRight.features.length) return;

    const getStyle = (
      minVal: number,
      maxVal: number,
    ): ((feature?: GeoJSON.Feature) => L.PathOptions) => {
      return (feature?: GeoJSON.Feature) => {
        const value = feature?.properties?.value as number | undefined;
        const name = feature?.properties?.name as string | undefined;
        const nameInAcList =
          !name ||
          acList.length === 0 ||
          acList.some((a) => name.toLowerCase() === a.toLowerCase());
        if (typeof value !== "number" || !isFinite(value) || !nameInAcList) {
          return { fillOpacity: 0, stroke: false };
        }
        const t =
          maxVal !== minVal ? (value - minVal) / (maxVal - minVal) : 1;
        const fillColor = getChoroplethColor(t, mapPalette);
        const opacity = maxVal !== minVal ? 0.25 + t * 0.45 : 0.7;
        return {
          fillColor,
          fillOpacity: tabularOpacity * opacity,
          color: fillColor,
          weight: 1,
          opacity: 0.7,
        };
      };
    };

    // leaflet-side-by-side requires getContainer(); GeoJSON lacks it. Use separate panes
    // and attach getContainer so the plugin can clip each side.
    if (!map.getPane("sbs-left")) map.createPane("sbs-left");
    if (!map.getPane("sbs-right")) map.createPane("sbs-right");

    const leftLayer = L.geoJSON(geojsonLeft as GeoJSON.GeoJSON, {
      style: getStyle(minLeft, maxLeft),
      pane: "sbs-left",
    });
    const rightLayer = L.geoJSON(geojsonRight as GeoJSON.GeoJSON, {
      style: getStyle(minRight, maxRight),
      pane: "sbs-right",
    });

    (leftLayer as L.Layer & { getContainer?: () => HTMLElement }).getContainer = () =>
      map.getPane("sbs-left")!;
    (rightLayer as L.Layer & { getContainer?: () => HTMLElement }).getContainer = () =>
      map.getPane("sbs-right")!;

    leftLayer.addTo(map);
    rightLayer.addTo(map);

    const control = sideBySide(leftLayer, rightLayer, { padding: 44 });
    control.addTo(map);

    const cleanupLabels = addSwipeLabels(
      map,
      yearLeft,
      yearRight,
      control as SideBySideControl,
      {
        minYear,
        maxYear,
        onYearLeftChange: setYearLeft,
        onYearRightChange: setYearRight,
      },
    );

    controlRef.current = control;
    leftLayerRef.current = leftLayer;
    rightLayerRef.current = rightLayer;

    return () => {
      cleanupLabels?.();
      control.remove();
      map.removeLayer(leftLayer);
      map.removeLayer(rightLayer);
      controlRef.current = null;
      leftLayerRef.current = null;
      rightLayerRef.current = null;
    };
  }, [
    comparisonMode,
    comparisonView,
    hasTabularLayer,
    hasDisasterLayerActive,
    map,
    geojsonLeft,
    geojsonRight,
    minLeft,
    maxLeft,
    minRight,
    maxRight,
    tabularOpacity,
    acList,
    mapPalette,
    minYear,
    maxYear,
    setYearLeft,
    setYearRight,
  ]);

  return null;
}
