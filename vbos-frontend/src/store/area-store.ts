import { AreaCouncilGeoJSON } from "@/types/data";
import { featureCollection } from "@turf/helpers";
import { create } from "zustand";

interface AreaState {
  /** Selected provinces (multi-select). */
  provinces: string[];
  /** Selected area councils (multi-select). */
  acList: string[];
  acGeoJSON: AreaCouncilGeoJSON;
  setProvinces: (provinces: string[]) => void;
  setAcList: (acList: string[]) => void;
  setAcGeoJSON: (acGeoJSON: AreaCouncilGeoJSON) => void;
  /** First province for backward compat / single-value consumers. */
  province: string;
  /** First area council for backward compat / single-value consumers. */
  ac: string;
  syncFromUrl: () => void;
}

export const useAreaStore = create<AreaState>((set) => ({
  provinces: [],
  acList: [],
  acGeoJSON: featureCollection([]),
  province: "",
  ac: "",

  setAcGeoJSON: (acGeoJSON: AreaCouncilGeoJSON) => set({ acGeoJSON }),

  setAcList: (acList: string[]) => {
    set({
      acList,
      ac: acList[0] ?? "",
    });
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      params.delete("ac");
      acList.forEach((a) => params.append("ac", a));
      const { pathname } = window.location;
      const next = params.toString() ? `?${params}` : pathname;
      window.history.replaceState(null, "", next);
    });
  },

  setProvinces: (provinces: string[]) => {
    set({
      provinces,
      province: provinces[0] ?? "",
      acList: [],
      ac: "",
      acGeoJSON: featureCollection([]),
    });
    queueMicrotask(() => {
      const params = new URLSearchParams(window.location.search);
      params.delete("ac");
      params.delete("province");
      provinces.forEach((p) => params.append("province", p));
      const next = params.toString() ? `?${params}` : window.location.pathname;
      window.history.replaceState(null, "", next);
    });
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const acAll = params.getAll("ac");
    const provinceAll = params.getAll("province");
    set({
      provinces: provinceAll,
      acList: acAll,
      province: provinceAll[0] ?? "",
      ac: acAll[0] ?? "",
    });
  },
}));
