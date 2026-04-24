import { useQuery } from "@tanstack/react-query";
import API from "@/api";
import type { TabularData } from "@/types/api";

/**
 * Fetches pre-aggregated tabular data from the backend. Use this instead of
 * useDataset for choropleth displays to avoid fetching thousands of rows.
 */
function useTabularAggregate(
  id: number,
  params: {
    group_by: "province" | "area_council";
    year: string;
    province?: string; // required when group_by=area_council
  },
) {
  const { isPending, error, data } = useQuery({
    queryKey: ["tabular-aggregate", id, params.group_by, params.year, params.province],
    queryFn: () =>
      API.getTabularAggregate(id, {
        group_by: params.group_by,
        year: params.year,
        agg: "sum",
        province: params.province,
      }),
    staleTime: 10 * 60 * 1000,
    enabled:
      Boolean(id && params.year) &&
      (params.group_by !== "area_council" || Boolean(params.province)),
  });

  const results: TabularData[] =
    data?.results?.map((r) => {
      if ("province" in r) {
        return {
          id: 0,
          attribute: r.attribute,
          date: `${params.year}-01-01`,
          value: r.value,
          province: r.province,
        };
      }
      return {
        id: 0,
        attribute: r.attribute,
        date: `${params.year}-01-01`,
        value: r.value,
        area_council: r.area_council,
      };
    }) ?? [];

  return { isPending, error, data: data ?? null, results };
}

export { useTabularAggregate };
