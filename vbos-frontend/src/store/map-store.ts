import { create } from "zustand";

export type ViewState = {
  latitude: number;
  longitude: number;
  zoom: number;
};

const DEFAULT_VIEW: ViewState = {
  latitude: -16.7087,
  longitude: 167.5997,
  zoom: 6,
};

function getInitialViewState(): ViewState {
  if (typeof window === "undefined") return DEFAULT_VIEW;
  const params = new URLSearchParams(window.location.search);
  const lng = params.get("lng");
  const lat = params.get("lat");
  const zoom = params.get("zoom");
  if (lng != null && lat != null && !Number.isNaN(parseFloat(lng)) && !Number.isNaN(parseFloat(lat))) {
    return {
      ...DEFAULT_VIEW,
      longitude: parseFloat(lng),
      latitude: parseFloat(lat),
      zoom: zoom != null && !Number.isNaN(parseFloat(zoom)) ? parseFloat(zoom) : DEFAULT_VIEW.zoom,
    };
  }
  return DEFAULT_VIEW;
}

// Leaflet uses raster tile URLs (not MapLibre style URLs)
export const BASEMAP_STYLES = [
  {
    id: "positron",
    label: "Light",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    hasLabels: true,
    hasTerrain: false,
  },
  {
    id: "positron_nolabels",
    label: "Light (no labels)",
    url: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    hasLabels: false,
    hasTerrain: false,
  },
  {
    id: "dark",
    label: "Dark",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    hasLabels: true,
    hasTerrain: false,
  },
  {
    id: "dark_nolabels",
    label: "Dark (no labels)",
    url: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    hasLabels: false,
    hasTerrain: false,
  },
  {
    id: "bright",
    label: "Bright",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    hasLabels: true,
    hasTerrain: false,
  },
  {
    id: "terrain",
    label: "Terrain",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    hasLabels: true,
    hasTerrain: true,
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    hasLabels: false,
    hasTerrain: false,
  },
  {
    id: "google_satellite",
    label: "Google Satellite",
    url: "https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    subdomains: ["0", "1", "2", "3"],
    attribution: '&copy; <a href="https://www.google.com/maps">Google</a>',
    hasLabels: false,
    hasTerrain: false,
  },
] as const;

export type MapMode = "2d" | "3d";

interface MapState {
  viewState: ViewState;
  mapStyle: string;
  mapMode: MapMode;
  setViewState: (viewState: Partial<ViewState>) => void;
  setMapStyle: (style: string) => void;
  setMapMode: (mode: MapMode) => void;
  syncFromUrl: () => void;
  syncToUrl: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  mapStyle: BASEMAP_STYLES[0].url,
  mapMode: "2d",
  viewState: getInitialViewState(),

  setMapMode: (mode) => set({ mapMode: mode }),

  setViewState: (updates) => {
    set((state) => ({
      viewState: { ...state.viewState, ...updates },
    }));
  },

  setMapStyle: (style: string) => {
    set({ mapStyle: style });
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const lng = params.get("lng");
    const lat = params.get("lat");
    const zoom = params.get("zoom");
    if (lng != null && lat != null && !Number.isNaN(parseFloat(lng)) && !Number.isNaN(parseFloat(lat))) {
      set((state) => ({
        viewState: {
          ...state.viewState,
          longitude: parseFloat(lng),
          latitude: parseFloat(lat),
          zoom: zoom != null && !Number.isNaN(parseFloat(zoom))
            ? parseFloat(zoom)
            : state.viewState.zoom,
        },
      }));
    }
  },

  syncToUrl: () => {
    const { viewState } = get();
    const params = new URLSearchParams(window.location.search);
    params.set("lng", viewState.longitude.toFixed(4));
    params.set("lat", viewState.latitude.toFixed(4));
    params.set("zoom", viewState.zoom.toFixed(1));
    const rest = params.toString();
    window.history.replaceState(null, "", rest ? `?${rest}` : window.location.pathname);
  },
}));
