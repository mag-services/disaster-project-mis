import { useQuery } from "@tanstack/react-query";
import { getRecentSubmissions, type SubmissionsResponse } from "@/api/getSubmissions";

/**
 * Fetches recent area data submissions to populate the Command Centre incidents table.
 * Returns the most recently updated submissions (any status), newest first.
 */
export function useRecentSubmissions() {
  return useQuery<SubmissionsResponse>({
    queryKey: ["recent-submissions"],
    queryFn: () =>
      getRecentSubmissions({
        ordering: "-updated",
        limit: 10,
      }),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}
