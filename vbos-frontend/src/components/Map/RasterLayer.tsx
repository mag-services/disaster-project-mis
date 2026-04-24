import { useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { useDateStore } from "@/store/date-store";
import { useScenario } from "@/hooks/useScenario";
import { useComparisonStore } from "@/store/comparison-store";
import { useCheckRasterLayer } from "@/hooks/useCheckRasterLayer";
import { useLandCoverRaster } from "@/hooks/useLandCoverRaster";
import { useLandCoverFilterStore } from "@/store/land-cover-filter-store";
import { getLandCoverColormap, LAND_COVER_COLORMAP } from "../colors";

export function RasterLayers() {
  const { layers } = useLayerStore();
  const scenario = useScenario();
  const { comparisonMode } = useComparisonStore();
  const hasRaster = layers.split(",").some((l) => l.startsWith("r"));
  const hideForRasterComparison =
    scenario.uiConfig.showComparison && comparisonMode && hasRaster;

  const rasterLayers = layers
    .split(",")
    .filter((i) => i.startsWith("r"))
    .map((i) => Number(i.slice(1)));

  if (hideForRasterComparison) return null;

  return (
    <>
      {rasterLayers.map((layer) => (
        <RasterMapLayer id={layer} key={layer} />
      ))}
    </>
  );
}

type RasterMapLayerProps = {
  id: number;
};

function RasterMapLayer({ id }: RasterMapLayerProps) {
  const map = useMap();
  const layerId = `r${id}`;
  const { year } = useDateStore();
  const { getLayerMetadata } = useLayerStore();
  const landCover = useLandCoverRaster();
  const { hiddenClasses } = useLandCoverFilterStore();
  // Fallback: useLandCoverRaster when layer store hasn't populated yet (e.g. URL load)
  const metadata = (getLayerMetadata(layerId) ||
    (landCover?.layerId === layerId ? landCover.dataset : undefined)) as import("@/types/api").RasterDataset | undefined;
  const datasetUrlId = metadata?.filename_id || "";
  // Use precomputed only when explicitly set. Otherwise use TiTiler (when filename_id is set).
  const precomputedUrl = metadata?.precomputed_tile_url || undefined;
  const isPrecomputed = Boolean(precomputedUrl);
  const isLandCover = landCover?.layerId === layerId;

  let urlParams = metadata?.titiler_url_params
    ? `?${metadata.titiler_url_params}`
    : "";
  if (isLandCover && !isPrecomputed) {
    const colormapObj =
      hiddenClasses.size > 0
        ? getLandCoverColormap(hiddenClasses)
        : LAND_COVER_COLORMAP;
    const colormap = encodeURIComponent(JSON.stringify(colormapObj));
    urlParams += urlParams ? "&" : "?";
    urlParams += `colormap=${colormap}&colormap_type=explicit`;
  }

  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const opacity = getEffectiveOpacity(layerId, getOpacity(layerId) / 100);

  const { error } = useCheckRasterLayer(datasetUrlId, year, isPrecomputed);

  useEffect(() => {
    if (!map || error) return;
    if (isPrecomputed ? !precomputedUrl : !datasetUrlId) return;

    let url: string;
    if (isPrecomputed) {
      const template = precomputedUrl!.replace(/\{year\}/g, year);
      const apiHost = import.meta.env.VITE_API_HOST ?? "";
      url =
        apiHost && template.startsWith("/")
          ? `${apiHost.replace(/\/$/, "")}${template}`
          : template;
    } else {
      url = `${import.meta.env.VITE_TITILER_API}/dataset/${datasetUrlId}/years/${year}/tiles/WebMercatorQuad/{z}/{x}/{y}.png${urlParams}`;
    }

    // Use dedicated pane above PMTiles (450) so land cover is visible
    const paneName = "raster-pane";
    if (!map.getPane(paneName)) {
      const pane = map.createPane(paneName);
      if (pane) pane.style.zIndex = "500";
    }
    const tileLayer = L.tileLayer(url, {
      opacity,
      maxNativeZoom: 14,
      maxZoom: 18,
      pane: paneName,
      // TiTiler WebMercatorQuad = XYZ; gdal2tiles precomputed (no --xyz) = TMS
      tms: isPrecomputed,
    });
    tileLayer.addTo(map);

    return () => {
      map.removeLayer(tileLayer);
    };
  }, [map, datasetUrlId, year, urlParams, opacity, isPrecomputed, precomputedUrl, hiddenClasses, error]);

  return null;
}
