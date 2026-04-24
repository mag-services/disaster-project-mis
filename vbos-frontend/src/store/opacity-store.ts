/**
 * Opacity store for managing layer opacity values.
 *
 * Stores opacity values (0-100) for each layer by layer ID (e.g., "v1", "t2", "r3").
 * Opacity values are persisted in the store but not synced to URL.
 */

import { create } from "zustand";

interface OpacityState {
  /** Map of layer ID to opacity value (0-100) */
  opacities: Record<string, number>;
  /** Set opacity for a specific layer */
  setOpacity: (layerId: string, opacity: number) => void;
  /** Get opacity for a specific layer (defaults to 100 if not set) */
  getOpacity: (layerId: string) => number;
}

export const useOpacityStore = create<OpacityState>((set, get) => ({
  opacities: {},

  setOpacity: (layerId: string, opacity: number) => {
    set((state) => ({
      opacities: {
        ...state.opacities,
        [layerId]: opacity,
      },
    }));
  },

  getOpacity: (layerId: string) => {
    const { opacities } = get();
    return opacities[layerId] ?? 100; // Default to 100% if not set
  },
}));
