import { useQuery } from "@tanstack/react-query";
import { getLandAccounts } from "@/api/getLandAccounts";
import landAccountsJson from "@/data/landAccountsData.json";
import type { LandAccountsData } from "@/data/landAccountsData";

const FALLBACK_DATA = landAccountsJson as LandAccountsData;

/** Fetch land accounts from API. Falls back to static JSON when API fails or returns empty. */
export function useLandAccounts() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["land-accounts"],
    queryFn: async () => {
      try {
        const result = await getLandAccounts();
        if (result.provinces && Object.keys(result.provinces).length > 0) {
          return result;
        }
      } catch {
        // Fall through to fallback
      }
      return FALLBACK_DATA;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    landAccountsData: data ?? FALLBACK_DATA,
    isLoading,
    error,
    refetch,
  };
}
