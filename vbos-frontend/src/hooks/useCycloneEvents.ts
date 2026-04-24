import { useQuery } from "@tanstack/react-query";
import API from "@/api";

export function useCycloneEvents() {
  return useQuery({
    queryKey: ["cyclone-events"],
    queryFn: () => API.getCycloneEvents(),
    staleTime: 1000 * 60 * 5, // 5 min — events change infrequently
  });
}
