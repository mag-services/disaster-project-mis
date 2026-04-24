import { useQuery } from "@tanstack/react-query";
import API from "@/api";

function useDataset(
  dataType: "tabular" | "vector",
  id: number,
  filters: URLSearchParams,
) {
  const { isPending, error, data } = useQuery({
    queryKey: [
      "dataset",
      dataType,
      id,
      new URLSearchParams(filters).toString(),
    ],
    queryFn: () => API.getDatasetData(dataType, id, filters),
    staleTime: 10 * 60 * 1000, // 10 min – dataset data rarely changes mid-session
  });

  return {
    isPending,
    error,
    data,
  };
}

export { useDataset };
