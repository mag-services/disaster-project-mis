/**
 * Config-driven KPI system. Reusable definitions with formula, unit, trend, thresholds.
 */

export type ThresholdOperator = "gte" | "lte" | "gt" | "lt";

export interface KpiThreshold {
  value: number;
  operator: ThresholdOperator;
  label: string;
  severity: "warning" | "danger";
}

export interface KpiResult {
  value: number;
  delta?: number;
  formatted: string;
  alert?: KpiThreshold;
}

export interface KpiConfig<T = unknown> {
  id: string;
  label: string;
  formula: (data: T) => KpiResult;
  unit: string;
  trend?: boolean;
  thresholds?: KpiThreshold[];
  /** Drill-down data for modal/sheet */
  getDrillDown?: (data: T) => KpiDrillDownData | null;
}

export interface KpiDrillDownData {
  title: string;
  rows: { label: string; value: string | number }[];
  source?: string;
}

/** Check if value triggers a threshold */
export function checkThreshold(
  value: number,
  thresholds: KpiThreshold[],
): KpiThreshold | undefined {
  for (const t of thresholds) {
    const hit =
      t.operator === "gte" && value >= t.value ||
      t.operator === "lte" && value <= t.value ||
      t.operator === "gt" && value > t.value ||
      t.operator === "lt" && value < t.value;
    if (hit) return t;
  }
  return undefined;
}
