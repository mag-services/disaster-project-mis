/**
 * Shared hook for cyclone intensity data (vector or PMTiles).
 * Used by CycloneSummaryBanner and CycloneIntensityCard.
 */
import { useQuery } from "@tanstack/react-query";
import { useLayerStore } from "@/store/layer-store";
import { useAreaStore } from "@/store/area-store";
import { getDatasetData, getPmtilesIntensity } from "@/api/getDatasets";
import { getHighestIntensity } from "@/config/disaster";

export type IntensityRow = {
  areaCouncil: string;
  province: string;
  intensity: string | number;
  intensityColor?: string;
};

function isCycloneIntensityLayer(
  metadata: { name?: string; cyclone_name?: string | null } | undefined,
): boolean {
  if (!metadata) return false;
  return !!(
    metadata.cyclone_name ||
    metadata.name?.toLowerCase().includes("cyclone intensity")
  );
}

function featuresToRows(
  features: Array<{ properties?: Record<string, unknown> | null }>,
): IntensityRow[] {
  return (features ?? []).map((f) => {
    const p = f.properties ?? {};
    const ac = (p.area_council ?? p.acname ?? p.name ?? "").toString();
    const prov = (p.province ?? p.Province ?? "").toString();
    const intensity = (p.Intensity ?? p.intensity ?? "") as string | number;
    const color = (p.intensity_color as string) ?? undefined;
    return { areaCouncil: ac, province: prov, intensity, intensityColor: color };
  });
}

export function useCycloneIntensityData(): {
  rows: IntensityRow[];
  cycloneName: string;
  maxIntensity: { label: string; color: string } | null;
  isLoading: boolean;
  hasData: boolean;
} | null {
  const { layers, getLayerMetadata } = useLayerStore();
  const { provinces, acList } = useAreaStore();

  // Compute derived values without early returns (hooks must run unconditionally)
  const hasAreaSelected = provinces.length > 0 || acList.length > 0;
  const activeLayerIds = layers.split(",").filter(Boolean);
  const cycloneLayer = hasAreaSelected
    ? activeLayerIds.find((id) => {
        const meta = getLayerMetadata(id);
        return isCycloneIntensityLayer(meta);
      })
    : null;
  const metadata = cycloneLayer ? getLayerMetadata(cycloneLayer) : null;
  const isVector = cycloneLayer?.startsWith("v") ?? false;
  const isPmtiles = cycloneLayer?.startsWith("p") ?? false;
  const datasetId = cycloneLayer ? parseInt(cycloneLayer.slice(1), 10) : 0;
  const isValidId = !Number.isNaN(datasetId) && datasetId > 0;

  const filters = new URLSearchParams();
  if (hasAreaSelected) {
    provinces.forEach((p) => filters.append("province", p));
    acList.forEach((a) => filters.append("area_council", a));
  }

  const vectorEnabled = hasAreaSelected && isVector && isValidId;
  const pmtilesEnabled = hasAreaSelected && isPmtiles && isValidId;

  // Hooks must be called unconditionally (Rules of Hooks)
  const vectorQuery = useQuery({
    queryKey: ["dataset", "vector", datasetId, filters.toString()],
    queryFn: () => getDatasetData("vector", datasetId, filters),
    enabled: vectorEnabled,
  });

  const pmtilesQuery = useQuery({
    queryKey: ["dataset", "pmtiles", "intensity", datasetId, filters.toString()],
    queryFn: () => getPmtilesIntensity(datasetId, filters),
    enabled: pmtilesEnabled,
  });

  if (!hasAreaSelected || !cycloneLayer || !metadata) return null;
  if (!vectorEnabled && !pmtilesEnabled) return null;

  const data = vectorEnabled ? vectorQuery.data : pmtilesQuery.data;
  const isPending = vectorEnabled ? vectorQuery.isPending : pmtilesQuery.isPending;
  const error = vectorEnabled ? vectorQuery.error : pmtilesQuery.error;

  const cycloneName = (metadata.cyclone_name || metadata.name || "") as string;

  if (error || !data) {
    return {
      rows: [],
      cycloneName,
      maxIntensity: null,
      isLoading: isPending,
      hasData: false,
    };
  }

  const features =
    "features" in data ? (data.features ?? []) : ("results" in data ? [] : []);
  const rows = featuresToRows(features);
  const maxIntensity = getHighestIntensity(rows);

  return {
    rows,
    cycloneName,
    maxIntensity,
    isLoading: isPending,
    hasData: rows.length > 0,
  };
}
