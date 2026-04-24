import { useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import {
  GeomType,
  leafletLayer,
  LineLabelSymbolizer,
  LineSymbolizer,
  PolygonSymbolizer,
} from "protomaps-leaflet";
import type { LabelRule, PaintRule } from "protomaps-leaflet";
import { useLayerStore } from "@/store/layer-store";
import { useOpacityStore } from "@/store/opacity-store";
import { useFocusStore } from "@/store/focus-store";
import { useDateStore } from "@/store/date-store";
import { getCoastalShorelineColor, MAP_COLORS } from "../colors";
import { useColorMode } from "../ui/color-mode";

/**
 * Rewrite PMTiles URLs to use the backend proxy for byte-serving (Range requests).
 * Django's default media serving lacks Content-Length/Range support required by PMTiles.
 */
function resolvePmtilesUrl(url: string): string {
  try {
    // Extract filename for proxy: "media/roads.pmtiles" or "http://x/media/roads.pmtiles" or "coastal_shorelines.pmtiles" -> "roads.pmtiles"
    let filename: string | undefined;
    if (url.includes("/media/") && url.endsWith(".pmtiles")) {
      filename = url.split("/media/").pop() ?? undefined;
    } else if (url.endsWith(".pmtiles") && !url.includes("://")) {
      // Plain filename or relative path (e.g. coastal_shorelines.pmtiles) - route through proxy
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
      return `/api/v1/pmtiles-serve/${filename}`;
    }
  } catch {
    /* ignore */
  }
  return url;
}

export function PMTilesLayers() {
  const { layers } = useLayerStore();
  const pmTilesLayers = layers
    .split(",")
    .filter((i) => i.startsWith("p"))
    .map((i) => Number(i.slice(1)));

  return (
    <>
      {pmTilesLayers.map((layer) => (
        <PMTilesMapLayer id={layer} key={layer} />
      ))}
    </>
  );
}

type PMTilesMapLayerProps = {
  id: number;
};

function PMTilesMapLayer({ id }: PMTilesMapLayerProps) {
  const map = useMap();
  const { colorMode } = useColorMode();
  const mapPalette = MAP_COLORS[colorMode === "dark" ? "dark" : "light"];
  const layerId = `p${id}`;
  const { getLayerMetadata } = useLayerStore();
  const metadata = getLayerMetadata(layerId);
  const { year } = useDateStore();
  const { getOpacity } = useOpacityStore();
  const { getEffectiveOpacity } = useFocusStore();
  const opacity = getEffectiveOpacity(layerId, getOpacity(layerId) / 100);

  useEffect(() => {
    if (!map || !metadata?.url) return;

    const sourceLayer = metadata.source_layer || "default";
    const resolvedUrl = resolvePmtilesUrl(metadata.url);

    // Ensure PMTiles render above basemap and overlays (tilePane=200, overlayPane=400)
    const paneName = "pmtiles-pane";
    if (!map.getPane(paneName)) {
      const pane = map.createPane(paneName);
      if (pane) pane.style.zIndex = "450";
    }

    const paintRules: PaintRule[] = [
      {
        dataLayer: sourceLayer,
        symbolizer: new PolygonSymbolizer({
          fill: (_z, f) =>
            (f?.props?.intensity_color as string) || "#cccccc",
          opacity,
          stroke: "#666",
          width: 1,
        }),
        filter: (_z, f) => f?.geomType === GeomType.Polygon,
      },
      {
        dataLayer: sourceLayer,
        symbolizer: new LineSymbolizer({
          color: metadata.cyclone_name
            ? mapPalette.areaCouncilBorder
            : (_z, f) => {
                const y = f?.props?.year ?? f?.props?.Year ?? f?.props?.YEAR;
                const val =
                  typeof y === "string" || typeof y === "number" ? y : undefined;
                return getCoastalShorelineColor(val ?? undefined);
              },
          width: metadata.cyclone_name ? 2 : 1.5,
          opacity,
          dash: metadata.cyclone_name ? undefined : [4, 2],
          perFeature: !metadata.cyclone_name,
        }),
        filter: (_z, f) => {
          if (f?.geomType === GeomType.Polygon) return false;
          // Non-cyclone layers (e.g. coastal shorelines): show all line features
          if (!metadata.cyclone_name) return true;
          // Cyclone layers: filter by year; support year, Year, YEAR
          const featYear = f?.props?.year ?? f?.props?.Year ?? f?.props?.YEAR;
          if (featYear == null || featYear === undefined || featYear === "") return true;
          return featYear === Number(year) || String(featYear) === String(year);
        },
      },
    ];

    const labelRules: LabelRule[] =
      !metadata.cyclone_name
        ? [
            {
              dataLayer: sourceLayer,
              minzoom: 12,
              symbolizer: new LineLabelSymbolizer({
                labelProps: ["year", "Year", "YEAR", "year_str"],
                fill: "#1f2937",
                stroke: "#ffffff",
                width: 1.5,
                fontSize: 10,
                repeatDistance: 150,
                maxLabelChars: 6,
              }),
              filter: (_z, f) => f?.geomType !== GeomType.Polygon,
            },
          ]
        : [];

    const layer = leafletLayer({
      url: resolvedUrl,
      paintRules,
      labelRules,
      backgroundColor: "transparent",
      pane: paneName,
    });

    (layer as unknown as L.Layer).addTo(map);

    return () => {
      map.removeLayer(layer as unknown as L.Layer);
    };
  }, [map, metadata, year, opacity, mapPalette]);

  return null;
}
