/**
 * Focus mode: dim all layers except the focused one.
 */
import { create } from "zustand";

const DIM_OPACITY = 0.25;

interface FocusState {
  focusedLayerId: string | null;
  setFocusedLayerId: (id: string | null) => void;
  /** Effective opacity when focus mode is on: 1 for focused, DIM for others */
  getEffectiveOpacity: (layerId: string, baseOpacity: number) => number;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  focusedLayerId: null,

  setFocusedLayerId: (id) => set({ focusedLayerId: id }),

  getEffectiveOpacity: (layerId, baseOpacity) => {
    const { focusedLayerId } = get();
    if (!focusedLayerId) return baseOpacity;
    return layerId === focusedLayerId ? baseOpacity : baseOpacity * DIM_OPACITY;
  },
}));
