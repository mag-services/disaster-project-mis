/**
 * Interactive swipe (curtain) comparison: drag handle to compare Before (yearLeft) vs After (yearRight).
 * Renders when Compare years is on, Climate mode, and a raster layer is active.
 */
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-side-by-side";
import { useComparisonStore } from "@/store/comparison-store";
import { useLayerStore } from "@/store/layer-store";
import { useScenario } from "@/hooks/useScenario";
import { useOpacityStore } from "@/store/opacity-store";
import { useLandCoverRaster } from "@/hooks/useLandCoverRaster";
import { useLandCoverFilterStore } from "@/store/land-cover-filter-store";
import { getLandCoverColormap, LAND_COVER_COLORMAP } from "../colors";

const sideBySide = (L.control as unknown as { sideBySide?: (left: L.Layer, right: L.Layer, opts?: { padding?: number }) => L.Control }).sideBySide;

type SideBySideControl = L.Control & {
  _divider?: HTMLDivElement;
  _container?: HTMLDivElement;
};

function addSwipeLabels(
  map: L.Map,
  yearLeft: string,
  yearRight: string,
  control: SideBySideControl,
): () => void {
  const container = map.getContainer();
  const hint = document.createElement("div");
  hint.style.cssText =
    "position:absolute;top:12px;left:0;right:0;pointer-events:none;z-index:1000;display:flex;justify-content:space-between;align-items:center;padding:0 16px;gap:8px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.95);text-shadow:0 1px 2px rgba(0,0,0,0.5)";
  const leftSpan = document.createElement("span");
  leftSpan.textContent = `${yearLeft} (Before)`;
  leftSpan.style.cssText = "padding:4px 10px;border-radius:6px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px)";
  const centerSpan = document.createElement("span");
  centerSpan.textContent = "Drag handle to compare";
  centerSpan.style.cssText = "opacity:0.85";
  const rightSpan = document.createElement("span");
  rightSpan.textContent = `${yearRight} (After)`;
  rightSpan.style.cssText = "padding:4px 10px;border-radius:6px;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px)";
  hint.appendChild(leftSpan);
  hint.appendChild(centerSpan);
  hint.appendChild(rightSpan);
  container.style.position = "relative";
  container.appendChild(hint);

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

export function RasterComparisonOverlay() {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);
  const leftLayerRef = useRef<L.TileLayer | null>(null);
  const rightLayerRef = useRef<L.TileLayer | null>(null);

  const { comparisonMode, yearLeft, yearRight } = useComparisonStore();
  const scenario = useScenario();
  const { layers, getLayerMetadata } = useLayerStore();
  const { getOpacity } = useOpacityStore();

  const rasterIds = layers.split(",").filter((i) => i.startsWith("r"));
  const hasRasterLayer = rasterIds.length > 0;
  const rasterId = rasterIds[0];
  const landCover = useLandCoverRaster();
  const { hiddenClasses } = useLandCoverFilterStore();
  // Fallback: useLandCoverRaster when layer store hasn't populated yet
  const metadata = rasterId
    ? (getLayerMetadata(rasterId) || (landCover?.layerId === rasterId ? landCover.dataset : undefined))
    : undefined;
  const datasetUrlId = metadata?.filename_id ?? "";
  // Use precomputed only when explicitly set. Otherwise use TiTiler.
  const precomputedUrl = metadata?.precomputed_tile_url || undefined;
  const isPrecomputed = Boolean(precomputedUrl);
  let urlParams = metadata?.titiler_url_params ? `?${metadata.titiler_url_params}` : "";
  if (landCover?.layerId === rasterId && !isPrecomputed) {
    const colormapObj =
      hiddenClasses.size > 0
        ? getLandCoverColormap(hiddenClasses)
        : LAND_COVER_COLORMAP;
    const colormap = encodeURIComponent(JSON.stringify(colormapObj));
    urlParams += urlParams ? "&" : "?";
    urlParams += `colormap=${colormap}&colormap_type=explicit`;
  }
  const opacity = rasterId ? (getOpacity(rasterId) ?? 100) / 100 : 1;

  useEffect(() => {
    if (!scenario.uiConfig.showComparison || !comparisonMode || !hasRasterLayer || !metadata || !sideBySide) return;
    if (isPrecomputed ? !precomputedUrl : !datasetUrlId) return;

    const apiHost = import.meta.env.VITE_API_HOST ?? "";
    const resolveUrl = (template: string) =>
      apiHost && template.startsWith("/")
        ? `${apiHost.replace(/\/$/, "")}${template}`
        : template;

    let leftUrl: string;
    let rightUrl: string;
    if (isPrecomputed) {
      leftUrl = resolveUrl(precomputedUrl!.replace(/\{year\}/g, yearLeft));
      rightUrl = resolveUrl(precomputedUrl!.replace(/\{year\}/g, yearRight));
    } else {
      const baseUrl = `${import.meta.env.VITE_TITILER_API}/dataset/${datasetUrlId}/years`;
      leftUrl = `${baseUrl}/${yearLeft}/tiles/WebMercatorQuad/{z}/{x}/{y}.png${urlParams}`;
      rightUrl = `${baseUrl}/${yearRight}/tiles/WebMercatorQuad/{z}/{x}/{y}.png${urlParams}`;
    }

    // Use dedicated pane above PMTiles (450) so land cover is visible
    const paneName = "raster-pane";
    if (!map.getPane(paneName)) {
      const pane = map.createPane(paneName);
      if (pane) pane.style.zIndex = "500";
    }
    const layerOpts = {
      opacity,
      maxNativeZoom: 14,
      maxZoom: 18,
      pane: paneName,
      tms: isPrecomputed, // gdal2tiles = TMS; TiTiler WebMercatorQuad = XYZ
    };
    const leftLayer = L.tileLayer(leftUrl, layerOpts);
    const rightLayer = L.tileLayer(rightUrl, layerOpts);

    leftLayer.addTo(map);
    rightLayer.addTo(map);

    const control = sideBySide(leftLayer, rightLayer, { padding: 44 });
    control.addTo(map);

    const cleanupLabels = addSwipeLabels(map, yearLeft, yearRight, control as SideBySideControl);

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
    scenario,
    comparisonMode,
    hasRasterLayer,
    map,
    yearLeft,
    yearRight,
    datasetUrlId,
    urlParams,
    metadata,
    opacity,
    hiddenClasses,
    isPrecomputed,
    precomputedUrl,
  ]);

  return null;
}
