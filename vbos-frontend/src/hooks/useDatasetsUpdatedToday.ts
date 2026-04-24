import { useQuery } from "@tanstack/react-query";
import { getAuditLog } from "@/api/getAuditLog";

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useDatasetsUpdatedToday() {
  return useQuery<number>({
    queryKey: ["datasets-updated-today"],
    queryFn: async () => {
      const today = formatDateYYYYMMDD(new Date());
      const res = await getAuditLog({
        date_from: today,
        date_to: today,
        page_size: 1,
      });
      return res.count;
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 2,
  });
}
