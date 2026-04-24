/**
 * Impact Mode: combine hazard + population + infrastructure → estimated affected population
 */
import { create } from "zustand";

interface ImpactModeState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}

export const useImpactModeStore = create<ImpactModeState>((set) => ({
  enabled: false,
  setEnabled: (enabled) => set({ enabled }),
}));
