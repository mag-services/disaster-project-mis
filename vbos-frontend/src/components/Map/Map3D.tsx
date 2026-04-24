/**
 * 3D map view using MapLibre GL. Toggle via map controls.
 * Shows perspective view for disaster visualization.
 * Respects the basemap selected in 2D (Light, Dark, Satellite, etc.).
 * Includes terrain/elevation and scenario layers (vector, raster, PMTiles).
 */
import { useEffect } from "react";
import { Map as MapLibreMap, useMap } from "@vis.gl/react-maplibre";
import maplibregl, { type Map as MapLibreMapType } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import { Button } from "@/components/ui/button";
import { LuMinus, LuPlus } from "react-icons/lu";
import { useMapStore, BASEMAP_STYLES } from "@/store/map-store";
import { useColorMode } from "@/components/ui/color-mode";
import { Map3DLayers } from "./Map3DLayers";

/** Free terrain DEM tiles (MapLibre demotiles – global coverage, no API key). */
const TERRAIN_TILES_URL =
  import.meta.env.VITE_TERRAIN_TILES_URL ||
  "https://demotiles.maplibre.org/terrain-tiles/tiles.json";

/** MapLibre GL style URLs for each basemap. Leaflet uses raster URLs; MapLibre needs GL-style JSON. */
const MAPLIBRE_STYLE_BY_ID: Record<string, string> = {
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  positron_nolabels: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  dark_nolabels: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  bright: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  terrain: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json", // no free terrain GL; fallback
  satellite: "__raster__", // use SATELLITE_STYLE
  google_satellite: "__raster__",
};

/** Esri World Imagery as MapLibre raster style (satellite). */
const SATELLITE_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    esri: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    },
  },
  layers: [{ id: "esri-satellite", type: "raster", source: "esri" }],
};

function Map3DControls() {
  const mapCollection = useMap() as { current?: { getMap(): MapLibreMapType }; default?: { getMap(): MapLibreMapType } } | undefined;
  const mapRef = mapCollection?.current ?? mapCollection?.default;
  const mapInstance = mapRef?.getMap?.();
  const { setMapMode } = useMapStore();

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-0.5 overflow-hidden rounded-lg border border-border p-1 shadow-[0_4px_20px_-4px_rgb(0_0_0_/0.08),0_0_0_1px_var(--border)] glass-surface">
      <Button
        variant="secondary"
        size="sm"
        className="h-9 w-full justify-start"
        onClick={() => setMapMode("2d")}
      >
        2D mode
      </Button>
      <div className="mx-1 h-px bg-border" />
      <div className="flex flex-col gap-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          aria-label="Zoom in"
          onClick={() => mapInstance?.zoomIn()}
        >
          <LuPlus className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-9 w-9"
          aria-label="Zoom out"
          onClick={() => mapInstance?.zoomOut()}
        >
          <LuMinus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function getMapLibreStyle(mapStyleUrl: string, colorMode: string | undefined) {
  const current = BASEMAP_STYLES.find((s) => s.url === mapStyleUrl);
  const id = current?.id ?? "positron";

  if (id === "satellite" || id === "google_satellite") {
    return SATELLITE_STYLE;
  }

  const glUrl = MAPLIBRE_STYLE_BY_ID[id];
  if (glUrl) return glUrl;

  return colorMode === "dark"
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
}

/** Adds terrain to the map after style loads. */
function Map3DTerrain() {
  const mapCollection = useMap() as { current?: { getMap(): MapLibreMapType }; default?: { getMap(): MapLibreMapType } } | undefined;
  const mapRef = mapCollection?.current ?? mapCollection?.default;
  const map = mapRef?.getMap?.();

  useEffect(() => {
    if (!map) return;
    const addTerrain = () => {
      if (map.getSource("terrain-dem")) return;
      map.addSource("terrain-dem", {
        type: "raster-dem",
        url: TERRAIN_TILES_URL,
        tileSize: 256,
      });
      map.setTerrain({ source: "terrain-dem", exaggeration: 1.5 });
    };
    if (map.isStyleLoaded()) {
      addTerrain();
    } else {
      map.once("style.load", addTerrain);
    }
    return () => {
      try {
        if (map?.getTerrain?.()) map.setTerrain(null);
        if (map?.getSource?.("terrain-dem")) map.removeSource("terrain-dem");
      } catch {
        /* map may be destroyed when switching views */
      }
    };
  }, [map]);
  return null;
}

export function Map3D() {
  const { viewState, mapStyle } = useMapStore();
  const { colorMode } = useColorMode();
  const style = getMapLibreStyle(mapStyle, colorMode);

  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <MapLibreMap
        mapLib={maplibregl}
        mapStyle={style}
        style={{ width: "100%", height: "100%" }}
        initialViewState={{
          longitude: viewState.longitude,
          latitude: viewState.latitude,
          zoom: viewState.zoom,
          pitch: 45,
          bearing: 0,
        }}
        onMove={(ev) =>
          ev.viewState && useMapStore.getState().setViewState(ev.viewState)
        }
      >
        <Map3DTerrain />
        <Map3DControls />
        <Map3DLayers />
      </MapLibreMap>
    </div>
  );
}
