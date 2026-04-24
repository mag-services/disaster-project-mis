import { create } from "zustand";

interface DateState {
  year: string;
  setYear: (year: string) => void;
  syncFromUrl: () => void;
}

export const useDateStore = create<DateState>((set) => ({
  year: "2020",

  setYear: (year: string) => {
    set({ year });
    const params = new URLSearchParams(window.location.search);
    if (year) {
      params.set("year", `${year}`);
    } else {
      params.delete("year");
    }
    window.history.replaceState(null, "", `?${params.toString()}`);
  },

  syncFromUrl: () => {
    const params = new URLSearchParams(window.location.search);
    const year = params.get("year");
    if (year) {
      set({ year });
    }
  },
}));
