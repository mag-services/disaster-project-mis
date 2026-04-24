/**
 * Tabular (disaster) KPI definitions. Generated from layer attributes.
 */
import { getAttributeValueSum } from "@/utils/getAttributes";
import { formatCompactNumber } from "@/utils/formatCharts";
import type { TabularData } from "@/types/api";
import type { KpiConfig } from "./kpis";

export type TabularKpiContext = {
  data: TabularData[];
  attribute: string;
  unit?: string;
};

/** Create a KPI config for a tabular attribute */
export function createTabularKpi(attribute: string): KpiConfig<TabularKpiContext> {
  return {
    id: `tabular_${attribute}`,
    label: attribute.replace(/_/g, " "),
    unit: "", // filled by context
    formula: (ctx) => {
      const total = getAttributeValueSum(ctx.data, ctx.attribute);
      return {
        value: total,
        formatted: formatCompactNumber(total),
      };
    },
    getDrillDown: (ctx) => {
      const byProvince = ctx.data
        .filter((i) => i.attribute === ctx.attribute)
        .reduce<Record<string, number>>((acc, i) => {
          const p = i.province ?? "Unknown";
          acc[p] = (acc[p] ?? 0) + (i.value ?? 0);
          return acc;
        }, {});
      const rows = Object.entries(byProvince)
        .sort(([, a], [, b]) => b - a)
        .map(([label, value]) => ({
          label,
          value: formatCompactNumber(value),
        }));
      return {
        title: `${ctx.attribute.replace(/_/g, " ")} by province`,
        rows,
      };
    },
  };
}
