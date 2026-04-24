/**
 * Shared land cover stats from dataset (landcover_stats.json).
 * Used by LandCoverTotalsChart (right sidebar) and ClimateKeyIndicators (map overlay).
 * Single source of truth for land cover data.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDeferredArea } from "./useDeferredArea";
import { useDateStore } from "@/store/date-store";
import { LAND_COVER_CLASS_ORDER } from "@/config/landCover";

const STATS_URL = "/media/landcover_stats.json";
type LandcoverStats = Record<string, Record<string, Record<string, number>>>;

export interface LandCoverClassData {
  name: string;
  y: number; // percentage
  area: number; // km²
}

export function useLandCoverStats() {
  const { province } = useDeferredArea();
  const { year } = useDateStore();

  const { data: stats, isLoading } = useQuery<LandcoverStats | null>({
    queryKey: ["landcover-stats"],
    queryFn: async () => {
      const res = await fetch(STATS_URL);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data, total, byPixel } = useMemo(() => {
    if (!stats || !year) return { data: [] as LandCoverClassData[], total: 0, byPixel: {} as Record<string, number> };
    const yearData = stats[String(year)];
    if (!yearData) return { data: [], total: 0, byPixel: {} };

    const provinceKey = province || "National";
    const byPixel = yearData[provinceKey] ?? yearData.National ?? {};
    const totalArea = Object.values(byPixel).reduce((s, v) => s + v, 0);
    const data = LAND_COVER_CLASS_ORDER.map((className, i) => {
      const pixel = String(i);
      const area = byPixel[pixel] ?? 0;
      const y = totalArea > 0 ? Math.round((area / totalArea) * 1000) / 10 : 0;
      return { name: className, y, area };
    });
    return { data, total: totalArea, byPixel };
  }, [stats, year, province]);

  return { stats, data, total, byPixel, isLoading };
}
