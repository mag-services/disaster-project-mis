import { Feature } from "geojson";

export interface IListApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ICluster {
  id: number;
  name: string;
  description?: string;
}

export interface ICycloneEvent {
  id: number;
  name: string;
  slug: string;
  season_year: number;
  is_archived: boolean;
  started_on: string | null;
  ended_on: string | null;
}

/** Owning ministry/partner when set (API catalog governance). */
export interface DatasetOwningOrganisation {
  id: number;
  slug: string;
  name: string;
  short_name: string | null;
}

export interface BaseDataset {
  id: number;
  name: string;
  description: string;
  created: string;
  updated: string;
  cluster?: string | null; // Cluster name; null for Climate-only rasters
  owning_organisation?: DatasetOwningOrganisation | null;
  type: DatasetType;
  source: string | null;
  unit?: string | null;
  filename_id?: string;
  titiler_url_params?: string;
  /**
   * Optional URL template for precomputed tiles (raster + tabular joins).
   * Placeholders: {z}, {x}, {y}, {year}. When set, used instead of TiTiler.
   */
  precomputed_tile_url?: string | null;
  url?: string;
  source_layer?: string;
  /** Name of cyclone/event (e.g. Cyclone Lola). Shown when layer is active. */
  cyclone_name?: string | null;
  /** Catalog visibility; API lists published only unless staff uses ?publication=all */
  publication_status?: "draft" | "published" | "archived";
  published_at?: string | null;
  published_by_id?: number | null;
  /** Set when the dataset row is saved from Django admin */
  created_by_id?: number | null;
  updated_by_id?: number | null;
}

export interface TabularDataset extends BaseDataset {
  dataType: "tabular";
  /** Canonical cyclone/event record for damage, resources, and financial tabular types. */
  cyclone_event?: {
    id: number;
    name: string;
    slug: string;
    season_year: number;
  } | null;
}

export interface RasterDataset extends BaseDataset {
  dataType: "raster";
  /** When true, treated as categorical land cover; frontend auto-activates in Climate mode. */
  is_land_cover?: boolean;
}

export interface VectorDataset extends BaseDataset {
  dataType: "vector";
  /** Icon key for map display (e.g. mapPin, cross). Empty = auto from cluster/index. */
  icon?: string | null;
  /** Hex color for map markers (e.g. #005bb7). Empty = auto from cluster/index. */
  color?: string | null;
  /**
   * Ordered list of GeoJSON property keys to show in the map popup/tooltip.
   * Empty or omitted = show all properties (except id/ref/metadata in default mode).
   */
  popup_properties?: string[];
}

export interface PMTilesDataset extends BaseDataset {
  dataType: "pmtiles";
}

export type Dataset =
  | TabularDataset
  | RasterDataset
  | VectorDataset
  | PMTilesDataset;

export interface ClusterDatasets {
  type: DatasetType;
  datasets: Dataset[];
}

export type DatasetType =
  | "baseline"
  | "estimated_damage"
  | "aid_resources_needed"
  | "estimate_financial_damage";

export interface TabularData {
  id: number;
  attribute: string;
  date: string;
  value: number;
  province?: string;
  area_council?: string;
  Unit?: string;
  [key: string]: string | number | undefined; // Allow other API fields
}

/** Response from tabular aggregate endpoint (group_by=province or area_council). */
export interface TabularAggregateResult {
  group_by: "province" | "area_council";
  year: string | null;
  attribute: string | null;
  agg: "sum" | "count" | "avg";
  results: Array<
    | { province: string; attribute: string; value: number }
    | { area_council: string; attribute: string; value: number }
  >;
}

export interface PaginatedVectorData {
  count: number;
  next: string | null;
  previous: string | null;
  type: "FeatureCollection";
  features: Feature[];
}
