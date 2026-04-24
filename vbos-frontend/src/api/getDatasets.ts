import * as HTTP from "./http";
import {
  Dataset,
  ClusterDatasets,
  PaginatedVectorData,
  TabularAggregateResult,
  TabularData,
} from "@/types/api";

const API_BASE = "/api/v1";

export interface ExposureResult {
  layer_id: number;
  layer_name: string;
}

export interface ProvinceExposureResult {
  province: string;
  score: number;
  raw_count: number;
}

/** Check which hazard (vector polygon) layers contain a point. For asset-level direct risk. */
export async function getAssetExposure(
  lat: number,
  lng: number,
  vectorLayerIds: number[],
): Promise<ExposureResult[]> {
  if (vectorLayerIds.length === 0) return [];
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    vector_layer_ids: vectorLayerIds.join(","),
  });
  const response = await HTTP.get(`${API_BASE}/exposure/?${params}`);
  if (!response.ok) return [];
  return response.json();
}

/** Province-level exposure scores for Command Centre risk panel. */
export async function getProvinceExposure(): Promise<ProvinceExposureResult[]> {
  const response = await HTTP.get(`${API_BASE}/exposure/?group_by=province`);
  if (!response.ok) return [];
  return response.json();
}

/** Fetch a single dataset's metadata (icon, color, etc.) by type and id. */
export async function getDatasetDetail(
  dataType: "vector" | "tabular" | "raster" | "pmtiles",
  id: number,
): Promise<Dataset> {
  const url = `${API_BASE}/${dataType}/${id}/`;
  const response = await HTTP.get(url);
  if (!response.ok) throw new Error(`Failed to fetch ${dataType} dataset ${id}`);
  const raw = await response.json();
  return { ...raw, dataType } as Dataset;
}

interface ClusterDatasetsResponse {
  tabular: Record<string, unknown>[];
  raster: Record<string, unknown>[];
  vector: Record<string, unknown>[];
  pmtiles: Record<string, unknown>[];
}

export async function getDatasets(
  cluster: string,
  scenario?: "disaster" | "climate",
): Promise<ClusterDatasets[]> {
  const params = new URLSearchParams({ cluster });
  if (scenario) params.set("scenario", scenario);
  const response = await HTTP.get(
    `${API_BASE}/datasets/?${params.toString()}`,
  );
  if (!response.ok)
    throw new Error(`Unable to fetch datasets for cluster ${cluster}`);

  const data: ClusterDatasetsResponse = await response.json();

  const allDatasets = [
    ...(data.tabular ?? []).map((d) => ({ ...d, dataType: "tabular" as const })),
    ...(data.raster ?? []).map((d) => ({ ...d, dataType: "raster" as const })),
    ...(data.vector ?? []).map((d) => ({ ...d, dataType: "vector" as const })),
    ...(data.pmtiles ?? []).map((d) => ({
      ...d,
      dataType: "pmtiles" as const,
    })),
  ] as Dataset[];

  const groupedByType: ClusterDatasets[] = allDatasets.reduce(
    (acc: ClusterDatasets[], item: Dataset) => {
      const existingType = acc.find(
        (group: ClusterDatasets) => group.type === item.type,
      );

      if (existingType) {
        existingType.datasets.push(item);
      } else {
        acc.push({
          type: item.type,
          datasets: [item],
        });
      }

      return acc;
    },
    [],
  );

  return groupedByType;
}

interface ListApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: TabularData[];
}

const PAGE_SIZE = 5000; // Backend DataResultsSetPagination max_page_size

export async function getDatasetData(
  dataType: "tabular" | "vector",
  id: number,
  filters?: URLSearchParams,
) {
  const queryString = filters ? new URLSearchParams(filters).toString() : "";
  const baseUrl = `${API_BASE}/${dataType}/${id}/data/?page_size=${PAGE_SIZE}${queryString ? `&${queryString}` : ""}`;

  // Fetch first page
  const firstResponse = await HTTP.get(baseUrl);
  if (!firstResponse.ok)
    throw new Error(`Unable to fetch data from ${baseUrl}`);

  const firstData = await firstResponse.json();
  let allResults = firstData as PaginatedVectorData | ListApiResponse;

  // Normalize: some backends return { type: "FeatureCollection", features } or { results }
  if (dataType === "vector") {
    if ("results" in firstData && Array.isArray(firstData.results) && !("features" in firstData)) {
      allResults = { ...firstData, features: firstData.results } as PaginatedVectorData;
    } else if ("type" in firstData && firstData.type === "FeatureCollection" && "features" in firstData) {
      allResults = firstData as PaginatedVectorData;
    }
  }

  const count = "count" in allResults ? (allResults as { count?: number }).count : null;
  const hasNext = "next" in allResults && (allResults as { next?: string | null }).next != null;
  const totalPages =
    count != null && count > 0 ? Math.ceil(count / PAGE_SIZE) : 1;

  if (totalPages <= 1 || !hasNext) return allResults;

  // Fetch remaining pages in parallel
  const pageUrls = Array.from(
    { length: totalPages - 1 },
    (_, i) => `${baseUrl}&page=${i + 2}`,
  );
  const responses = await Promise.all(pageUrls.map((u) => HTTP.get(u)));

  for (let i = 0; i < responses.length; i++) {
    if (!responses[i].ok)
      throw new Error(`Unable to fetch data from ${pageUrls[i]}`);
    const data = await responses[i].json();
    if (dataType === "vector" && "features" in allResults) {
      const pageFeatures = data.features ?? data.results ?? [];
      (allResults as PaginatedVectorData).features.push(...pageFeatures);
    }
    if (dataType === "tabular" && "results" in allResults) {
      (allResults as ListApiResponse).results.push(...data.results);
    }
  }

  return allResults as PaginatedVectorData | ListApiResponse;
}

/** Fetch cyclone intensity data for a PMTiles dataset, filtered by province/area_council. */
export async function getPmtilesIntensity(
  id: number,
  filters: URLSearchParams,
): Promise<{ type: string; features: Array<{ properties?: Record<string, unknown> }> }> {
  const queryString = filters.toString();
  const url = `${API_BASE}/pmtiles/${id}/intensity/${queryString ? `?${queryString}` : ""}`;
  const response = await HTTP.get(url);
  if (!response.ok) throw new Error(`Unable to fetch PMTiles intensity from ${url}`);
  return response.json();
}

/** Aggregated tabular data by province or area_council. Replaces frontend aggregation. */
export async function getTabularAggregate(
  id: number,
  params: {
    group_by: "province" | "area_council";
    year?: string;
    attribute?: string;
    agg?: "sum" | "count" | "avg";
    province?: string; // required when group_by=area_council
  },
): Promise<TabularAggregateResult> {
  const search = new URLSearchParams({
    group_by: params.group_by,
  });
  if (params.year) search.set("year", params.year);
  if (params.attribute) search.set("attribute", params.attribute);
  if (params.agg) search.set("agg", params.agg);
  if (params.province) search.set("province", params.province);

  const url = `${API_BASE}/tabular/${id}/aggregate/?${search.toString()}`;
  const response = await HTTP.get(url);
  if (!response.ok)
    throw new Error(`Unable to fetch aggregate from ${url}`);
  return response.json();
}
