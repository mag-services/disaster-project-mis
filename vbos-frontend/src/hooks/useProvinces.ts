import { useQuery } from "@tanstack/react-query";
import API from "@/api";

function useProvinces() {
  const { isPending, error, data } = useQuery({
    queryKey: ["provinces"],
    queryFn: () => API.getProvinces(),
  });

  return {
    isPending,
    error,
    data,
  };
}

export default useProvinces;
