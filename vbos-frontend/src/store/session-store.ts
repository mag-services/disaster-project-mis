/**
 * Persists last session state for smart restore on next visit.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "vbos-session";

interface SessionSnapshot {
  layers: string;
  scenarioId: string;
  year: string;
  province: string;
}

interface SessionState extends SessionSnapshot {
  savedAt: number;
  saveSession: (state: SessionSnapshot) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      layers: "",
      scenarioId: "disaster",
      year: "2024",
      province: "",
      savedAt: 0,

      saveSession: ({ layers, scenarioId, year, province }) => {
        set({
          layers,
          scenarioId,
          year,
          province,
          savedAt: Date.now(),
        });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        layers: s.layers,
        scenarioId: s.scenarioId,
        year: s.year,
        province: s.province,
        savedAt: s.savedAt,
      }),
    },
  ),
);
