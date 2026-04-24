/**
 * Saved workspace file format (Resilience Explorer–style map session).
 */
import type { ScenarioId } from "@/config/scenarios";
import type { DatasetType } from "@/types/api";
import type { TabularApiParams } from "@/types/mapQuery";

export const DRMIS_WORKSPACE_SCHEMA_VERSION = 1 as const;

export type PrimaryWorkspaceId = "command-centre" | "operations";

/** v1 workspace bundle — JSON-serializable only. */
export interface DRMISWorkspaceV1 {
  schemaVersion: typeof DRMIS_WORKSPACE_SCHEMA_VERSION;
  exportedAt: string;
  app: "drmis";
  /** Optional title for the user (filename default). */
  name?: string;
  scenarioId: ScenarioId;
  primaryWorkspace: PrimaryWorkspaceId;
  shellNavId: string;
  /** Left-sidebar cluster (datasets list); may be empty. */
  cluster: string;
  /** Comma-separated layer ids, e.g. t1,v2 */
  layers: string;
  selectedViewType: DatasetType | null;
  selectedClimateModule: string;
  year: string;
  provinces: string[];
  acList: string[];
  tabularAttributeFilter: string | null;
  tabularApiParams: TabularApiParams | null;
  map: {
    latitude: number;
    longitude: number;
    zoom: number;
    /** Tile layer URL (matches map store). */
    mapStyle: string;
    mapMode: "2d" | "3d";
  };
  compare: {
    enabled: boolean;
    view: "swipe" | "delta";
    yearLeft: string;
    yearRight: string;
  };
}
