import { useQuery } from "@tanstack/react-query";
import {
  getFieldTeamsDeployedCount,
  type FieldChecksCountResponse,
} from "@/api/getFieldChecksStats";

export function useFieldTeamsDeployed() {
  return useQuery<FieldChecksCountResponse>({
    queryKey: ["field-teams-deployed"],
    queryFn: getFieldTeamsDeployedCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}
