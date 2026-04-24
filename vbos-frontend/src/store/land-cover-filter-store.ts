/**
 * Store for toggling land cover class visibility on the map.
 * Hidden classes are rendered transparent in the raster colormap.
 */
import { create } from "zustand";
import { LAND_COVER_CLASS_ORDER } from "@/config/landCover";

type LandCoverType = (typeof LAND_COVER_CLASS_ORDER)[number];

interface LandCoverFilterState {
  /** Set of class names that are hidden (transparent) on the map */
  hiddenClasses: Set<LandCoverType>;
  toggleClass: (className: LandCoverType) => void;
  isVisible: (className: LandCoverType) => boolean;
  reset: () => void;
}

export const useLandCoverFilterStore = create<LandCoverFilterState>((set, get) => ({
  hiddenClasses: new Set(),

  toggleClass: (className) => {
    set((state) => {
      const next = new Set(state.hiddenClasses);
      if (next.has(className)) {
        next.delete(className);
      } else {
        next.add(className);
      }
      return { hiddenClasses: next };
    });
  },

  isVisible: (className) => !get().hiddenClasses.has(className),

  reset: () => set({ hiddenClasses: new Set() }),
}));
