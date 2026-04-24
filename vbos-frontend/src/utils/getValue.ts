import { TabularData } from "@/types/api";

export function getProvinceValue(items: TabularData[], province: string) {
  return items
    .filter((i) => i.province?.toLowerCase() === province.toLowerCase())
    .map((i: TabularData) => i.value)
    .reduce((acc: number, value: number) => acc + value, 0);
}

export function getAreaCouncilValue(
  items: TabularData[],
  area_council: string,
) {
  return items
    .filter((i) => i.area_council?.toLowerCase() === area_council.toLowerCase())
    .map((i: TabularData) => i.value)
    .reduce((acc: number, value: number) => acc + value, 0);
}
