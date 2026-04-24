/**
 * Renders scenario layers (vector, raster, PMTiles) on the MapLibre 3D map.
 * Syncs with layer-store so hazard/vector layers from 2D mode appear in 3D.
 */
import { useEffect, useState, useCallback } from "react";
import { useMap } from "@vis.gl/react-maplibre";
import maplibregl, { type Map as MapLibreMapType } from "maplibre-gl";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { useDateStore } from "@/store/date-store";
import { useLandCoverRaster } from "@/hooks/useLandCoverRaster";
import { useLandCoverFilterStore } from "@/store/land-cover-filter-store";
import API from "@/api";
import { VECTOR_LAYER_COLORS, VECTOR_CLUSTER_COLORS, MAP_COLORS } from "../colors";
import { useColorMode } from "../ui/color-mode";
import { getLandCoverColormap, LAND_COVER_COLORMAP } from "../colors";
import {
  build3DPinSvg,
  getVectorIconKey,
} from "./vectorIcons";

const DEFAULT_BBOX = "166,-21,170,-12";

function resolvePmtilesUrl(url: string): string {
  try {
    let filename: string | undefined;
    if (url.includes("/media/") && url.endsWith(".pmtiles")) {
      filename = url.split("/media/").pop() ?? undefined;
    } else if (url.endsWith(".pmtiles") && !url.includes("://")) {
      filename = url.split("/").pop();
    } else {
      const parsed = new URL(url, window.location.origin);
      if (parsed.pathname.includes("/media/") && parsed.pathname.endsWith(".pmtiles")) {
        filename = parsed.pathname.split("/media/").pop();
      } else if (parsed.pathname.endsWith(".pmtiles")) {
        filename = parsed.pathname.split("/").pop();
      }
    }
    if (filename && !filename.includes("/")) {
      const base = import.meta.env.VITE_API_HOST ?? "";
      const origin = base ? new URL(base, window.location.origin).origin : window.location.origin;
      return `${origin}/api/v1/pmtiles-serve/${filename}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}

const PIN_3D_W = 56;
const PIN_3D_H = 72;

/**
 * Renders the 3D perspective pin SVG into a MapLibre named image sprite.
 * Uses build3DPinSvg which includes radial gradients, depth shading, and a
 * ground shadow ellipse — giving a genuine raised-object look in 3D mode.
 */
function load3DPinImageToMap(
  map: MapLibreMapType,
  imageId: string,
  color: string,
  iconKey: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (map.hasImage(imageId)) {
      resolve();
      return;
    }
    const svgString = build3DPinSvg(color, iconKey);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image(PIN_3D_W * 2, PIN_3D_H * 2); // render at 2× for crispness
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (!map.hasImage(imageId)) {
        // sdf: false — we use pre-shaded gradients, not SDF colouring
        map.addImage(imageId, img, { pixelRatio: 2 });
      }
      resolve();
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function useMapLibreMap(): MapLibreMapType | undefined {
  const mapCollection = useMap() as { current?: { getMap(): MapLibreMapType }; default?: { getMap(): MapLibreMapType } } | undefined;
  const mapRef = mapCollection?.current ?? mapCollection?.default;
  return mapRef?.getMap?.();
}

export function Map3DLayers() {
  const map = useMapLibreMap();
  const { layers } = useLayerStore();
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];

  const vectorIds = layers.split(",").filter((l) => l.startsWith("v")).map((l) => Number(l.slice(1)));
  const rasterIds = layers.split(",").filter((l) => l.startsWith("r")).map((l) => Number(l.slice(1)));
  const pmtilesIds = layers.split(",").filter((l) => l.startsWith("p")).map((l) => Number(l.slice(1)));

  const [bbox, setBbox] = useState(DEFAULT_BBOX);

  const updateBbox = useCallback(() => {
    if (!map || typeof map.getBounds !== "function") return;
    try {
      const b = map.getBounds();
      if (b) {
        const w = b.getWest();
        const s = b.getSouth();
        const e = b.getEast();
        const n = b.getNorth();
        if (Number.isFinite(w) && Number.isFinite(s) && Number.isFinite(e) && Number.isFinite(n)) {
          setBbox(`${w},${s},${e},${n}`);
        }
      }
    } catch {
      /* keep previous */
    }
  }, [map]);

  useEffect(() => {
    if (!map || typeof map.on !== "function") return;
    updateBbox();
    map.on("moveend", updateBbox);
    return () => {
      if (map && typeof map.off === "function") map.off("moveend", updateBbox);
    };
  }, [map, updateBbox]);

  return (
    <>
      {vectorIds.map((id, i) => (
        <Map3DVectorLayer key={`v${id}`} id={id} colorIndex={i} bbox={bbox} />
      ))}
      {rasterIds.map((id) => (
        <Map3DRasterLayer key={`r${id}`} id={id} />
      ))}
      {pmtilesIds.map((id) => (
        <Map3DPMTilesLayer key={`p${id}`} id={id} mapPalette={mapPalette} />
      ))}
    </>
  );
}

function Map3DVectorLayer({
  id,
  colorIndex,
  bbox,
}: {
  id: number;
  colorIndex: number;
  bbox: string;
}) {
  const map = useMapLibreMap();
  const layerId = `v${id}`;
  const { getLayerMetadata } = useLayerStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const opacity = getEffectiveOpacity(layerId, getOpacity(layerId) / 100);
  const metadata = getLayerMetadata(layerId);
  const cluster = metadata?.cluster;
  const datasetColor = metadata && "color" in metadata && metadata.color ? metadata.color : undefined;
  const layerColor =
    datasetColor ??
    (cluster && VECTOR_CLUSTER_COLORS[cluster.toLowerCase().trim()]) ??
    VECTOR_LAYER_COLORS[colorIndex % VECTOR_LAYER_COLORS.length];

  // Same icon logic as Leaflet VectorLayers
  const iconKey = getVectorIconKey(
    colorIndex,
    cluster,
    metadata && "icon" in metadata ? (metadata as { icon?: string | null }).icon : undefined,
  );

  const pinImageId = `pin-${id}-${layerColor.replace("#", "")}`;

  useEffect(() => {
    if (!map) return;

    const sourceId = `vector-3d-${id}`;
    const layerIdFill = `vector-3d-${id}-fill`;
    const layerIdLine = `vector-3d-${id}-line`;
    const layerIdSymbol = `vector-3d-${id}-symbol`;

    const load = async () => {
      const filters = new URLSearchParams({ in_bbox: bbox });
      const data = await API.getDatasetData("vector", id, filters);
      if (!data || !("features" in data) || !data.features?.length) return;

      // Register the 3D pin SVG as a MapLibre sprite image
      try {
        await load3DPinImageToMap(map, pinImageId, layerColor, iconKey);
      } catch {
        /* fall through — symbol layer will just show nothing for points */
      }

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(data as GeoJSON.FeatureCollection);
        return;
      }

      map.addSource(sourceId, {
        type: "geojson",
        data: data as GeoJSON.FeatureCollection,
      });

      // Polygons
      map.addLayer({
        id: layerIdFill,
        type: "fill",
        source: sourceId,
        filter: ["in", ["geometry-type"], ["literal", ["Polygon", "MultiPolygon"]]],
        paint: {
          "fill-color": layerColor,
          "fill-opacity": opacity,
          "fill-outline-color": "#666",
        },
      });

      // Lines
      map.addLayer({
        id: layerIdLine,
        type: "line",
        source: sourceId,
        filter: ["in", ["geometry-type"], ["literal", ["LineString", "MultiLineString"]]],
        paint: {
          "line-color": layerColor,
          "line-width": 1.5,
          "line-opacity": opacity,
        },
      });

      // Points — 3D perspective pin: billboard mode, tip anchored to coordinate
      map.addLayer({
        id: layerIdSymbol,
        type: "symbol",
        source: sourceId,
        filter: ["in", ["geometry-type"], ["literal", ["Point", "MultiPoint"]]],
        layout: {
          "icon-image": pinImageId,
          // Scale: 56px SVG at pixelRatio:2 → effective 28px wide; 0.75 gives ~42px — visible but not huge
          "icon-size": 0.75,
          // Pin tip = anchor point, so the marker "sticks out" of the terrain surface
          "icon-anchor": "bottom",
          // Billboard: icon always faces the camera regardless of map bearing/pitch
          // This is what makes it look truly 3D — it stands upright even when tilted
          "icon-rotation-alignment": "viewport",
          "icon-pitch-alignment": "viewport",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "icon-opacity": opacity,
          // Slight translate upward so the pin visually rises off terrain
          "icon-translate": [0, -4],
          "icon-translate-anchor": "viewport",
        },
      });
    };

    // If the style is already loaded we can add layers immediately; otherwise
    // wait for the 'style.load' event so the guard never causes a silent bail-out.
    if (map.isStyleLoaded()) {
      load();
    } else {
      map.once("style.load", load);
    }

    return () => {
      // Cancel a pending once-listener in case the component unmounts before
      // the style finishes loading.
      map.off("style.load", load);
      try {
        [layerIdFill, layerIdLine, layerIdSymbol].forEach((lid) => {
          if (map?.getLayer?.(lid)) map.removeLayer(lid);
        });
        if (map?.getSource?.(sourceId)) map.removeSource(sourceId);
        // Clean up sprite image when layer is removed
        if (map?.hasImage?.(pinImageId)) map.removeImage(pinImageId);
      } catch {
        /* map may be destroyed when switching views */
      }
    };
  }, [map, id, bbox, layerColor, opacity, iconKey, pinImageId]);

  return null;
}

function Map3DRasterLayer({ id }: { id: number }) {
  const map = useMapLibreMap();
  const layerId = `r${id}`;
  const { year } = useDateStore();
  const { getLayerMetadata } = useLayerStore();
  const landCover = useLandCoverRaster();
  const { hiddenClasses } = useLandCoverFilterStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const opacity = getEffectiveOpacity(layerId, getOpacity(layerId) / 100);

  const metadata = (getLayerMetadata(layerId) ||
    (landCover?.layerId === layerId ? landCover.dataset : undefined)) as import("@/types/api").RasterDataset | undefined;
  const datasetUrlId = metadata?.filename_id || "";
  const precomputedUrl = metadata?.precomputed_tile_url || undefined;
  const isPrecomputed = Boolean(precomputedUrl);
  const isLandCover = landCover?.layerId === layerId;

  let urlParams = metadata?.titiler_url_params ? `?${metadata.titiler_url_params}` : "";
  if (isLandCover && !isPrecomputed) {
    const colormapObj = hiddenClasses.size > 0 ? getLandCoverColormap(hiddenClasses) : LAND_COVER_COLORMAP;
    const colormap = encodeURIComponent(JSON.stringify(colormapObj));
    urlParams += urlParams ? "&" : "?";
    urlParams += `colormap=${colormap}&colormap_type=explicit`;
  }

  useEffect(() => {
    if (!map || !map.isStyleLoaded()) return;
    if (isPrecomputed ? !precomputedUrl : !datasetUrlId) return;

    let url: string;
    if (isPrecomputed) {
      const template = precomputedUrl!.replace(/\{year\}/g, year);
      const apiHost = import.meta.env.VITE_API_HOST ?? "";
      url = apiHost && template.startsWith("/") ? `${apiHost.replace(/\/$/, "")}${template}` : template;
    } else {
      url = `${import.meta.env.VITE_TITILER_API}/dataset/${datasetUrlId}/years/${year}/tiles/WebMercatorQuad/{z}/{x}/{y}.png${urlParams}`;
    }

    const sourceId = `raster-3d-${id}`;
    const layerIdRaster = `raster-3d-${id}-raster`;

    map.addSource(sourceId, {
      type: "raster",
      tiles: [url],
      tileSize: 256,
    });
    map.addLayer({
      id: layerIdRaster,
      type: "raster",
      source: sourceId,
      paint: { "raster-opacity": opacity },
    });

    return () => {
      try {
        if (map?.getLayer?.(layerIdRaster)) map.removeLayer(layerIdRaster);
        if (map?.getSource?.(sourceId)) map.removeSource(sourceId);
      } catch {
        /* map may be destroyed when switching views */
      }
    };
  }, [map, id, year, datasetUrlId, precomputedUrl, isPrecomputed, urlParams, opacity]);

  return null;
}

function Map3DPMTilesLayer({
  id,
  mapPalette,
}: {
  id: number;
  mapPalette: { areaCouncilBorder: string };
}) {
  const map = useMapLibreMap();
  const { year } = useDateStore();
  const layerId = `p${id}`;
  const { getLayerMetadata } = useLayerStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const opacity = getEffectiveOpacity(layerId, getOpacity(layerId) / 100);
  const metadata = getLayerMetadata(layerId);

  useEffect(() => {
    if (!map || !map.isStyleLoaded() || !metadata?.url) return;

    const resolvedUrl = resolvePmtilesUrl(metadata.url);
    const pmtilesUrl = `pmtiles://${resolvedUrl}`;
    const sourceId = `pmtiles-3d-${id}`;
    const sourceLayer = metadata.source_layer || "default";

    if (map.getSource(sourceId)) {
      map.setPaintProperty(`${sourceId}-fill`, "fill-opacity", opacity);
      map.setPaintProperty(`${sourceId}-line`, "line-opacity", opacity);
      return;
    }

    map.addSource(sourceId, {
      type: "vector",
      url: pmtilesUrl,
    });

    map.addLayer({
      id: `${sourceId}-fill`,
      type: "fill",
      source: sourceId,
      "source-layer": sourceLayer,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": ["get", "intensity_color"],
        "fill-opacity": opacity,
        "fill-outline-color": "#666",
      },
    });
    const lineFilter = metadata.cyclone_name
      ? [
          "all",
          ["!=", ["geometry-type"], "Polygon"],
          [
            "any",
            ["==", ["get", "year"], Number(year)],
            ["==", ["to-string", ["get", "year"]], String(year)],
          ],
        ] as maplibregl.FilterSpecification
      : (["!=", ["geometry-type"], "Polygon"] as maplibregl.FilterSpecification);

    map.addLayer({
      id: `${sourceId}-line`,
      type: "line",
      source: sourceId,
      "source-layer": sourceLayer,
      filter: lineFilter,
      paint: {
        "line-color": metadata.cyclone_name
          ? mapPalette.areaCouncilBorder
          : ["coalesce", ["get", "intensity_color"], "#888"],
        "line-width": metadata.cyclone_name ? 2 : 1.5,
        "line-opacity": opacity,
      },
    });

    return () => {
      try {
        if (map?.getLayer?.(`${sourceId}-fill`)) map.removeLayer(`${sourceId}-fill`);
        if (map?.getLayer?.(`${sourceId}-line`)) map.removeLayer(`${sourceId}-line`);
        if (map?.getSource?.(sourceId)) map.removeSource(sourceId);
      } catch {
        /* map may be destroyed when switching views */
      }
    };
  }, [map, id, metadata, year, opacity, mapPalette]);

  return null;
}
