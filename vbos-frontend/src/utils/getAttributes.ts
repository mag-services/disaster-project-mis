import { TabularData } from "@/types/api";

export function getAttributes(items: TabularData[]) {
  return items
    .map((i: TabularData) => i.attribute)
    .reduce((acc: string[], attr: string) => {
      return acc.includes(attr) ? acc : [...acc, attr];
    }, []);
}

export function getAttributeValueSum(items: TabularData[], attribute: string) {
  return items
    .filter((i: TabularData) => i.attribute === attribute)
    .map((i) => i.value)
    .reduce((acc: number, value: number) => {
      return acc + value;
    }, 0);
}

export function getProvinceAttributeValueSum(
  items: TabularData[],
  province: string,
  attribute: string,
): number {
  return items
    .filter(
      (i: TabularData) => i.province?.toLowerCase() === province.toLowerCase(),
    )
    .filter((i: TabularData) => i.attribute === attribute)
    .map((i) => i.value)
    .reduce((acc: number, value: number) => {
      return acc + value;
    }, 0);
}

export function getAreaCouncilAttributeValueSum(
  items: TabularData[],
  area_council: string,
  attribute: string,
): number {
  return items
    .filter(
      (i: TabularData) =>
        i.area_council?.toLowerCase() === area_council.toLowerCase(),
    )
    .filter((i: TabularData) => i.attribute === attribute)
    .map((i) => i.value)
    .reduce((acc: number, value: number) => {
      return acc + value;
    }, 0);
}
