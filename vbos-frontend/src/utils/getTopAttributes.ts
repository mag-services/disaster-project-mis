import { TabularData } from "@/types/api";
import { getAttributes, getAttributeValueSum } from "./getAttributes";

const MAX_ATTRIBUTES = 10;

/**
 * Return top N attributes by total value, to keep charts readable.
 * Datasets with 50+ columns (e.g. Education) become unreadable otherwise.
 */
export function getTopAttributes(
  stats: TabularData[],
  max = MAX_ATTRIBUTES,
): string[] {
  const attributes = getAttributes(stats);
  if (attributes.length <= max) return attributes;

  const withTotals = attributes.map((attr) => ({
    attr,
    total: getAttributeValueSum(stats, attr),
  }));
  withTotals.sort((a, b) => b.total - a.total);
  return withTotals.slice(0, max).map((x) => x.attr);
}
