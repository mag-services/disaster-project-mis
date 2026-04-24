/**
 * Scenario-based view store. Replaces hardcoded disaster/climate with scenario engine.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScenarioId } from "@/config/scenarios";
import type { HeaderModeId } from "@/config/modes";
import { isHeaderModeId } from "@/config/modes";

interface ViewState {
  scenarioId: ScenarioId;
  /** @deprecated Use scenarioId and useScenario() instead. Kept for gradual migration. */
  viewMode: "disaster" | "climate";
  /** Remembered layer id string per header mode (comma-separated prefixes). */
  perModeLayers: Partial<Record<HeaderModeId, string>>;
  isLayerPanelSwitching: boolean;
  setLayerPanelSwitching: (v: boolean) => void;
  saveLayersForMode: (id: HeaderModeId, layers: string) => void;
  getLayersForMode: (id: HeaderModeId) => string | undefined;
  setScenario: (id: ScenarioId) => void;
  syncFromUrl: () => void;
}

const VIEW_PARAM = "view";

/** Maps URL view param to scenarioId. */
function viewParamToScenario(view: string | null): ScenarioId {
  if (view === "climate") return "climate";
  if (view === "compare") return "compare";
  if (view === "forecast" || view === "risk" || view === "planning") return view;
  return "disaster";
}

/** Maps scenarioId to URL view param (null = omit param, use “default” disaster). */
function scenarioToViewParam(id: ScenarioId): string | null {
  if (id === "disaster") return null;
  return id;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      scenarioId: "disaster",
      viewMode: "disaster",
      perModeLayers: {},
      isLayerPanelSwitching: false,

      setLayerPanelSwitching: (v) => set({ isLayerPanelSwitching: v }),

      saveLayersForMode: (id, layers) =>
        set((s) => ({
          perModeLayers: { ...s.perModeLayers, [id]: layers },
        })),

      getLayersForMode: (id) => get().perModeLayers[id],

      setScenario: (id) => {
        set({
          scenarioId: id,
          viewMode: id === "climate" ? "climate" : "disaster",
        });
        const params = new URLSearchParams(window.location.search);
        if (id === "disaster") {
          params.delete(VIEW_PARAM);
          params.delete("compare");
          params.delete("yearLeft");
          params.delete("yearRight");
        } else {
          const view = scenarioToViewParam(id);
          if (view) params.set(VIEW_PARAM, view);
        }
        const rest = params.toString();
        const url = rest
          ? `${window.location.pathname}?${rest}`
          : window.location.pathname;
        window.history.replaceState(null, "", url);
      },

      syncFromUrl: () => {
        const params = new URLSearchParams(window.location.search);
        const view = params.get(VIEW_PARAM);
        const scenarioId = viewParamToScenario(view);
        set({
          scenarioId,
          viewMode: scenarioId === "climate" ? "climate" : "disaster",
        });
      },
    }),
    {
      name: "vbos-view-modes",
      partialize: (state) => ({ perModeLayers: state.perModeLayers }),
    },
  ),
);

/** Current scenario if it is a header tab mode; otherwise null. */
export function headerModeFromScenario(id: ScenarioId): HeaderModeId | null {
  return isHeaderModeId(id) ? id : null;
}
