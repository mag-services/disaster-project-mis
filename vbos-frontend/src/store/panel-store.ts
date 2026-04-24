/**
 * Context panel store: selected feature for drill-down insights.
 */
import { create } from "zustand";

export interface SelectedFeatureInfo {
  latitude: number;
  longitude: number;
  properties: Record<string, unknown>;
  datasetName?: string;
  datasetId: string;
  popupProperties?: string[] | null;
  featureId?: number;
}

interface PanelState {
  selectedFeatureInfo: SelectedFeatureInfo | null;
  setSelectedFeatureInfo: (info: SelectedFeatureInfo | null) => void;
}

export const usePanelStore = create<PanelState>((set) => ({
  selectedFeatureInfo: null,
  setSelectedFeatureInfo: (info) => set({ selectedFeatureInfo: info }),
}));
