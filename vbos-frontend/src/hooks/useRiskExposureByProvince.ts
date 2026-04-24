import { useQuery } from "@tanstack/react-query";
import {
  getProvinceExposure,
  type ProvinceExposureResult,
} from "@/api/getDatasets";

export function useRiskExposureByProvince() {
  return useQuery<ProvinceExposureResult[]>({
    queryKey: ["risk-exposure-by-province"],
    queryFn: getProvinceExposure,
    refetchInterval: 120_000,
    staleTime: 60_000,
    retry: 2,
  });
}
