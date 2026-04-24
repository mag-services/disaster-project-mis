import { TabularData } from "@/types/api";
import {
  getAreaCouncilAttributeValueSum,
  getAttributes,
  getProvinceAttributeValueSum,
} from "./getAttributes";

type StatsType = {
  [key: string]: number | string;
  place: string;
};

export function consolidateStats(
  data: TabularData[],
  admin_area: "province" | "area_council" = "province",
) {
  let places: string[] = data
    .map((i) => i[admin_area])
    .filter((i) => i !== undefined);
  places = [...new Set(places)];

  const attributes: string[] = getAttributes(data);
  const results: StatsType[] = places
    .map((p) => ({ place: p }))
    .reduce((acc: StatsType[], p: StatsType) => {
      attributes.forEach(
        (attr) =>
          (p[attr] =
            admin_area === "province"
              ? getProvinceAttributeValueSum(data, p.place, attr)
              : getAreaCouncilAttributeValueSum(data, p.place, attr)),
      );
      return [...acc, p];
    }, []);

  return results;
}
