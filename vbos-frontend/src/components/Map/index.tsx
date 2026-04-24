import {
  forwardRef,
  Ref,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature } from "geojson";
import { bbox } from "@turf/bbox";
import { featureCollection } from "@turf/helpers";
import { useMapStore, BASEMAP_STYLES } from "@/store/map-store";
import { useAreaStore } from "@/store/area-store";
import useProvinces from "@/hooks/useProvinces";
import { useColorMode } from "@/components/ui/color-mode";
import { useLayerStore } from "@/store/layer-store";
import { usePanelStore } from "@/store/panel-store";
import { AdminAreaMapLayers } from "./AdminAreaLayers";
import { VectorLayers } from "./VectorLayers";
import { MapPopup } from "./MapPopup";
import { RasterLayers } from "./RasterLayer";
import { PMTilesLayers } from "./PMTilesLayers";
import { MapControlsCluster } from "./MapControlsCluster";
import { ComparisonOverlay } from "./ComparisonOverlay";
import { RasterComparisonOverlay } from "./RasterComparisonOverlay";
import { TabularDeltaOverlay } from "./TabularDeltaOverlay";
import { LandCoverLegend } from "./LandCoverLegend";
import { CycloneNameMapOverlay } from "./CycloneNameMapOverlay";

export interface PopupInfo {
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  datasetName?: string;
  datasetId: string;
  /** VectorDataset.popup_properties — filters/order for attribute list */
  popupProperties?: string[] | null;
  /** VectorItem id from GeoJSON feature (for admin lookup) */
  featureId?: number;
}

function MapEventHandler({
  onMove,
  onMoveEnd,
  onClick,
}: {
  onMove: () => void;
  onMoveEnd: () => void;
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    move: onMove,
    moveend: onMoveEnd,
    click: (e) => onClick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function MapReady({
  onMapReady,
  children,
}: {
  onMapReady: (map: LeafletMap | null) => void;
  children: React.ReactNode;
}) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
    return () => onMapReady(null);
  }, [map, onMapReady]);
  return <>{children}</>;
}

export type MapRef = {
  fitBounds: (bounds: [[number, number], [number, number]], options?: { padding?: number }) => void;
  flyTo: (center: [number, number], zoom?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getMap: () => LeafletMap | null;
};

function Map(_props: object, ref: Ref<MapRef | undefined>) {
  const [map, setMap] = useState<LeafletMap | null>(null);
  const { viewState, setViewState, syncToUrl, mapStyle, setMapStyle } = useMapStore();
  const { colorMode } = useColorMode();
  const { acGeoJSON, provinces, acList } = useAreaStore();
  const { data: provincesGeojson } = useProvinces();
  const { layers } = useLayerStore();
  const setSelectedFeatureInfo = usePanelStore((s) => s.setSelectedFeatureInfo);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);

  const currentStyle = BASEMAP_STYLES.find((s) => s.url === mapStyle) ?? BASEMAP_STYLES[0];

  useEffect(() => {
    if (popupInfo && !layers.includes(popupInfo.datasetId)) setPopupInfo(null);
  }, [popupInfo, layers]);

  useEffect(() => {
    setSelectedFeatureInfo(popupInfo);
  }, [popupInfo, setSelectedFeatureInfo]);

  useEffect(() => {
    if (!colorMode) return;
    const style = colorMode === "dark"
      ? BASEMAP_STYLES.find((s) => s.id === "dark")
      : BASEMAP_STYLES.find((s) => s.id === "positron");
    if (style) setMapStyle(style.url);
  }, [colorMode, setMapStyle]);

  const mapRefAdapter: MapRef = {
    fitBounds: (bounds, options) => {
      if (!map) return;
      // bounds from MapControlsCluster: [[minLng, minLat], [maxLng, maxLat]]
      // Leaflet expects [[minLat, minLng], [maxLat, maxLng]]
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;
      map.fitBounds(
        [[minLat, minLng], [maxLat, maxLng]] as L.LatLngBoundsExpression,
        {
          padding: options?.padding ? [options.padding, options.padding] : undefined,
          animate: true,
        },
      );
    },
    flyTo: (center, zoom = 12) => {
      if (!map) return;
      map.flyTo(center as L.LatLngTuple, zoom, { duration: 800 });
    },
    zoomIn: () => map?.zoomIn(),
    zoomOut: () => map?.zoomOut(),
    getMap: () => map,
  };

  useImperativeHandle(ref, () => mapRefAdapter, [map]);

  const onMove = useCallback(() => {
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    setViewState({
      latitude: center.lat,
      longitude: center.lng,
      zoom,
    });
  }, [map, setViewState]);

  const onMoveEnd = useCallback(() => {
    syncToUrl();
  }, [syncToUrl]);

  const onClick = useCallback(() => {
    setPopupInfo(null);
    setSelectedFeatureInfo(null);
  }, [setSelectedFeatureInfo]);

  useEffect(() => {
    if (!map) return;

    const fitToBounds = (
      geojson: { features: Feature[] },
      filterAcList?: string[],
    ) => {
      const features =
        filterAcList && filterAcList.length > 0
          ? geojson.features.filter((i) =>
              filterAcList.some(
                (a) =>
                  (i.properties?.name as string)?.toLowerCase() === a.toLowerCase(),
              ),
            )
          : geojson.features;
      const fc = featureCollection(features);
      if (!fc.features.length) return;
      const acBbox = bbox(fc);
      const bounds: L.LatLngBoundsExpression = [
        [acBbox[1], acBbox[0]] as L.LatLngTuple,
        [acBbox[3], acBbox[2]] as L.LatLngTuple,
      ];
      map.fitBounds(bounds, { animate: true });
    };

    const VANUATU_BOUNDS: L.LatLngBoundsExpression = [
      [-20.50641, -194.18335] as L.LatLngTuple,
      [-12.84665, -189.9646] as L.LatLngTuple,
    ];

    if (provinces.length === 0) {
      const id = requestAnimationFrame(() => {
        map.fitBounds(VANUATU_BOUNDS, { animate: true });
      });
      return () => cancelAnimationFrame(id);
    }

    if (acGeoJSON?.features?.length) {
      const id = requestAnimationFrame(() => {
        fitToBounds(acGeoJSON, acList.length > 0 ? acList : undefined);
      });
      return () => cancelAnimationFrame(id);
    }

    if (provincesGeojson?.features?.length) {
      const provinceFeatures = provincesGeojson.features.filter((f) =>
        provinces.some(
          (p) =>
            (f.properties?.name as string)?.toLowerCase() === p.toLowerCase(),
        ),
      );
      if (provinceFeatures.length) {
        const id = requestAnimationFrame(() => {
          fitToBounds({ features: provinceFeatures as Feature[] });
        });
        return () => cancelAnimationFrame(id);
      }
    }
  }, [acGeoJSON, acList, map, provinces, provincesGeojson]);

  return (
    <MapContainer
      center={[viewState.latitude, viewState.longitude]}
      zoom={viewState.zoom}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        key={currentStyle.id}
        url={currentStyle.url}
        attribution={currentStyle.attribution}
        {...("subdomains" in currentStyle && {
          subdomains: [...(currentStyle.subdomains as readonly string[])],
        })}
      />
      <MapReady onMapReady={setMap}>
        <MapEventHandler
          onMove={onMove}
          onMoveEnd={onMoveEnd}
          onClick={onClick}
        />
        <AdminAreaMapLayers
          setPopupInfo={setPopupInfo}
          activeFeatureName={
            popupInfo?.properties?.name as string | undefined
          }
        />
        <VectorLayers setPopupInfo={setPopupInfo} />
        <RasterLayers />
        <PMTilesLayers />
        <ComparisonOverlay />
        <TabularDeltaOverlay />
        <RasterComparisonOverlay />
        <LandCoverLegend />
        <CycloneNameMapOverlay />
        <MapControlsCluster map={mapRefAdapter} />
        {popupInfo && <MapPopup {...popupInfo} />}
      </MapReady>
    </MapContainer>
  );
}

export default forwardRef(Map);
