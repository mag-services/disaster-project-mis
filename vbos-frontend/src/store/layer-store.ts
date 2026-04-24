import { create } from "zustand";
import { Dataset, TabularData } from "@/types/api";
import type { TabularApiParams } from "@/types/mapQuery";

interface LayersState {
  layers: string; // used to store only the layerIds, ex: t1,v34,r54
  tabularLayerData: TabularData[];
  /** When set, filter tabular display to this attribute only (e.g. "ecce") */
  tabularAttributeFilter: string | null;
  /** Extra GET params for tabular /data/ (provinces, value_gte, …). Cleared when tabular layer changes. */
  tabularApiParams: TabularApiParams | null;
  allDatasets: Dataset[]; // used to store the metadata of all dataset layers
  setLayers: (layers: string) => void;
  setTabularAttributeFilter: (attr: string | null) => void;
  setTabularApiParams: (params: TabularApiParams | null) => void;
  switchLayer: (layer: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  setTabularLayerData: (data: TabularData[]) => void;
  setAllDatasets: (datasets: Dataset[], options?: { replace?: boolean }) => void;
  getLayerMetadata: (layer: string) => Dataset | undefined;
  syncFromUrl: () => void;
}

export const useLayerStore = create<LayersState>((set, get) => ({
  layers: "",
  tabularLayerData: [],
  tabularAttributeFilter: null as string | null,
  tabularApiParams: null as TabularApiParams | null,
  allDatasets: [],

  setTabularAttributeFilter: (attr) => set({ tabularAttributeFilter: attr }),

  setTabularApiParams: (params) => set({ tabularApiParams: params }),

  setLayers: (layers: string) => {
    set({ layers });
    const params = new URLSearchParams(window.location.search);
    if (layers) {
      params.set("layers", layers);
    } else {
      params.delete("layers");
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  },

  switchLayer: (layer: string) => {
    const { layers } = get();
    let layerArray = layers ? layers.split(",").filter(Boolean) : [];
    const isTabularLayer = layer.startsWith("t");
    const isRasterLayer = layer.startsWith("r");
    if (layerArray.includes(layer)) {
      layerArray = layerArray.filter((l) => l !== layer);
      if (isTabularLayer) {
        get().setTabularLayerData([]);
        get().setTabularAttributeFilter(null);
        get().setTabularApiParams(null);
      }
    } else {
      if (isTabularLayer) {
        layerArray = layerArray.filter((l) => !l.startsWith("t"));
        get().setTabularAttributeFilter(null);
        get().setTabularApiParams(null);
      }
      if (isRasterLayer) {
        layerArray = layerArray.filter((l) => !l.startsWith("r"));
      }
      layerArray.push(layer);
    }
    get().setLayers(layerArray.join());
  },

  reorderLayers: (fromIndex: number, toIndex: number) => {
    const { layers } = get();
    const layerArray = layers ? layers.split(",").filter(Boolean) : [];
    if (fromIndex < 0 || fromIndex >= layerArray.length || toIndex < 0 || toIndex >= layerArray.length) return;
    const [removed] = layerArray.splice(fromIndex, 1);
    layerArray.splice(toIndex, 0, removed);
    get().setLayers(layerArray.join());
  },

  setAllDatasets: (datasets: Dataset[], options?: { replace?: boolean }) => {
    if (options?.replace !== false) {
      // Replace when switching clusters, but preserve metadata for layers from other clusters
      // so Roads (Logistics) still shows correctly when viewing Education
      const { layers, allDatasets } = get();
      const layerIds = layers ? layers.split(",").map((l) => l.trim()).filter(Boolean) : [];
      const newIds = new Set(datasets.map((d) => `${d.dataType[0]}${d.id}`));
      const toPreserve = layerIds.filter((id) => !newIds.has(id));
      const preserved = toPreserve
        .map((id) => allDatasets.find((d) => `${d.dataType[0]}${d.id}` === id))
        .filter((d): d is Dataset => d != null);
      set({ allDatasets: [...datasets, ...preserved] });
    } else {
      // Merge when prefetching (e.g. layers from URL on load)
      const { allDatasets } = get();
      const existingIds = new Set(
        allDatasets.map((d) => `${d.dataType[0]}${d.id}`),
      );
      const newDatasets = datasets.filter(
        (d) => !existingIds.has(`${d.dataType[0]}${d.id}`),
      );
      if (newDatasets.length > 0) {
        set({ allDatasets: [...allDatasets, ...newDatasets] });
      }
    }
  },

  setTabularLayerData: (data: TabularData[]) => {
    set({ tabularLayerData: data });
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const layers = params.get("layers");
    if (layers) {
      set({ layers });
    }
  },

  getLayerMetadata: (layer: string) => {
    const { allDatasets } = get();
    const id = Number(layer.slice(1));

    return allDatasets.find(
      (i) => i.id === id && i.dataType.startsWith(layer.slice(0, 1)),
    );
  },
}));
