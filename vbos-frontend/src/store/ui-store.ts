import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DatasetType } from "@/types/api";

export type ColorModeOption = "light" | "dark";

/** Shell primary area: Command Centre dashboard vs map / operations workspace */
export type PrimaryWorkspace = "command-centre" | "operations";

/**
 * Cyclone RAP output types.
 * These three types are produced exclusively by the Quarto cyclone RAP tool and
 * must always be linked to a CycloneEvent (or RAPImportBatch) in the backend.
 * They are only shown in the right-sidebar Data view tabs when a cyclone risk
 * source is active (selectedRiskSource === "cyclone").
 */
export const DISASTER_VIEW_TYPES: DatasetType[] = [
  "estimated_damage",
  "aid_resources_needed",
  "estimate_financial_damage",
];

/**
 * The risk source the user entered from the Layer browser Risk sources tab.
 * null = no risk source active (only Baseline shown in right sidebar).
 * "cyclone" = cyclone RAP outputs (Damage, Resources, Financial) are shown.
 * Extend this union when flood / volcano RAPs are added.
 */
export type ActiveRiskSource = "cyclone" | null;

interface UiState {
  isTimeSeriesOpen: boolean;
  toggleTimeSeries: () => void;
  setTimeSeriesOpen: (open: boolean) => void;
  mobileOpenPanel: "left" | "right" | null;
  setMobileOpenPanel: (panel: "left" | "right" | null) => void;
  /** When true, mobile bottom sheet expands to full screen */
  mobilePanelFullScreen: boolean;
  setMobilePanelFullScreen: (v: boolean) => void;
  isMobile: boolean;
  setIsMobile: (v: boolean) => void;
  leftSidebarIconMode: boolean;
  setLeftSidebarIconMode: (v: boolean) => void;
  rightSidebarIconMode: boolean;
  setRightSidebarIconMode: (v: boolean) => void;
  rightSidebarExpanded: boolean;
  setRightSidebarExpanded: (v: boolean) => void;
  mapHoverFeature: boolean;
  setMapHoverFeature: (v: boolean) => void;
  /** Cluster selected in left sidebar; drives Dataset filter in right sidebar */
  selectedCluster: string;
  setSelectedCluster: (v: string) => void;
  /** Data view tab (Baseline, Damage, Resources, Financial); Disaster overlay shown when Damage/Resources/Financial */
  selectedViewType: DatasetType | null;
  setSelectedViewType: (v: DatasetType | null) => void;
  /** Climate module selected (Land Use, Coastal, etc.); one at a time */
  selectedClimateModule: string;
  setSelectedClimateModule: (v: string) => void;
  /**
   * Risk source chosen from the Layer browser Risk sources tab.
   * Controls whether RAP tabs (Damage, Resources, Financial) appear in the right sidebar.
   * null = no risk source; only Baseline is shown.
   */
  activeRiskSource: ActiveRiskSource;
  setActiveRiskSource: (v: ActiveRiskSource) => void;
  /**
   * The specific cyclone event the user selected from the Risk sources accordion.
   * null = no specific event chosen (shown when activeRiskSource is not "cyclone").
   * When set, TabularDatasetSelect filters RAP datasets to this event only.
   */
  selectedCycloneEventId: number | null;
  setSelectedCycloneEventId: (id: number | null) => void;
  /** Area data entry page (for area administrators) */
  dataEntryPageOpen: boolean;
  setDataEntryPageOpen: (v: boolean) => void;
  /** Active item id in shell sidebar (`dashboard`, `live-map`, …) */
  shellNavId: string;
  setShellNavId: (id: string) => void;
  /** Post-login landing vs map operations */
  primaryWorkspace: PrimaryWorkspace;
  setPrimaryWorkspace: (w: PrimaryWorkspace) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isTimeSeriesOpen: false,

      toggleTimeSeries: () => {
        set((state) => ({ isTimeSeriesOpen: !state.isTimeSeriesOpen }));
      },

      setTimeSeriesOpen: (open: boolean) => {
        set({ isTimeSeriesOpen: open });
      },

      mobileOpenPanel: null as "left" | "right" | null,
      setMobileOpenPanel: (panel) => set({ mobileOpenPanel: panel, mobilePanelFullScreen: false }),

      mobilePanelFullScreen: false,
      setMobilePanelFullScreen: (v) => set({ mobilePanelFullScreen: v }),

      isMobile: typeof window !== "undefined" && window.innerWidth < 768,
      setIsMobile: (v) => set({ isMobile: v, ...(v ? { mobileOpenPanel: null } : {}) }),

      leftSidebarIconMode: false,
      setLeftSidebarIconMode: (v) => set({ leftSidebarIconMode: v }),

      rightSidebarIconMode: false,
      setRightSidebarIconMode: (v) => set({ rightSidebarIconMode: v }),

      rightSidebarExpanded: false,
      setRightSidebarExpanded: (v) => set({ rightSidebarExpanded: v }),

      mapHoverFeature: false,
      setMapHoverFeature: (v) => set({ mapHoverFeature: v }),

      selectedCluster: "",
      setSelectedCluster: (v) => set({ selectedCluster: v }),

      selectedViewType: null,
      setSelectedViewType: (v) => set({ selectedViewType: v }),

      selectedClimateModule: "",
      setSelectedClimateModule: (v) => set({ selectedClimateModule: v }),

      activeRiskSource: null,
      setActiveRiskSource: (v) =>
        set({ activeRiskSource: v, ...(v === null ? { selectedCycloneEventId: null } : {}) }),

      selectedCycloneEventId: null,
      setSelectedCycloneEventId: (id) => set({ selectedCycloneEventId: id }),

      dataEntryPageOpen: false,
      setDataEntryPageOpen: (v) => set({ dataEntryPageOpen: v }),

      shellNavId: "dashboard",
      setShellNavId: (id) => set({ shellNavId: id }),

      primaryWorkspace: "command-centre",
      setPrimaryWorkspace: (w) => set({ primaryWorkspace: w }),
    }),
    {
      name: "vbos-ui",
      partialize: (s) => ({
        leftSidebarIconMode: s.leftSidebarIconMode,
        rightSidebarIconMode: s.rightSidebarIconMode,
        rightSidebarExpanded: s.rightSidebarExpanded,
        selectedClimateModule: s.selectedClimateModule,
      }),
    },
  ),
);
