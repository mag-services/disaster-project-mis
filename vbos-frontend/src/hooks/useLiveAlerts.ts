import { useQuery } from "@tanstack/react-query";
import { getLiveAlerts, type LiveAlertsResponse } from "@/api/getLiveAlerts";

export function useLiveAlerts() {
  return useQuery<LiveAlertsResponse>({
    queryKey: ["live-alerts"],
    queryFn: getLiveAlerts,
    refetchInterval: 120_000, // re-fetch every 2 minutes
    staleTime: 60_000,
    retry: 2,
  });
}
