/**
 * Climate (Land Accounts) KPI definitions.
 */
import {
  LAND_ACCOUNT_CATEGORIES,
  type LandAccountCategory,
  type LandAccountsData,
} from "@/data/landAccountsData";
import type { KpiConfig } from "./kpis";
import { checkThreshold } from "./kpis";

export type ClimateKpiContext = {
  provinces: string[];
  landAccountsData: LandAccountsData;
};

function computeClimateMetrics(provinces: string[], landAccountsData: LandAccountsData) {
  const changeSummary: { type: string; delta: number }[] = [];
  for (const p of provinces) {
    const pa = landAccountsData.provinces[p]?.physical_account;
    if (!pa) continue;
    for (const t of LAND_ACCOUNT_CATEGORIES) {
      const delta = pa.net_change[t] ?? 0;
      const existing = changeSummary.find((c) => c.type === t);
      if (existing) existing.delta += delta;
      else changeSummary.push({ type: t, delta });
    }
  }
  let nationalTotal = 0;
  for (const p of provinces) {
    const pa = landAccountsData.provinces[p]?.physical_account;
    if (pa) nationalTotal += Object.values(pa.closing).reduce((a, b) => a + b, 0);
  }
  const forest = changeSummary.find((c) => c.type === "Forest");
  const grassland = changeSummary.find((c) => c.type === "Grassland");
  const builtUp = changeSummary.find((c) => c.type === "Built Up");
  return {
    nationalTotal,
    forestDelta: forest?.delta ?? 0,
    grasslandDelta: grassland?.delta ?? 0,
    builtUpDelta: builtUp?.delta ?? 0,
    changeSummary,
    provinces,
  };
}

export const CLIMATE_KPIS: KpiConfig<ClimateKpiContext>[] = [
  {
    id: "total_land",
    label: "Total land",
    unit: "km²",
    formula: (ctx) => {
      const m = computeClimateMetrics(ctx.provinces, ctx.landAccountsData);
      return {
        value: m.nationalTotal,
        formatted: m.nationalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 }),
      };
    },
    getDrillDown: (ctx) => {
      const rows = ctx.provinces.map((p) => {
        const pa = ctx.landAccountsData.provinces[p]?.physical_account;
        const total = pa
          ? Object.values(pa.closing).reduce((a, b) => a + b, 0)
          : 0;
        return { label: p, value: total.toLocaleString(undefined, { maximumFractionDigits: 0 }) };
      });
      return { title: "Total land by province", rows, source: "Land Accounts 2020–2023" };
    },
  },
  {
    id: "forest_loss",
    label: "Forest",
    unit: "km²",
    trend: true,
    thresholds: [
      { value: -100, operator: "lte", label: "High forest loss", severity: "danger" },
      { value: -50, operator: "lte", label: "Moderate forest loss", severity: "warning" },
    ],
    formula: (ctx) => {
      const m = computeClimateMetrics(ctx.provinces, ctx.landAccountsData);
      const delta = m.forestDelta;
      const alert = checkThreshold(delta, [
        { value: -100, operator: "lte", label: "High forest loss", severity: "danger" },
        { value: -50, operator: "lte", label: "Moderate forest loss", severity: "warning" },
      ]);
      return {
        value: Math.abs(delta),
        delta,
        formatted: Math.abs(delta).toFixed(0),
        alert,
      };
    },
    getDrillDown: (ctx) => {
      const rows = ctx.provinces.map((p) => {
        const pa = ctx.landAccountsData.provinces[p]?.physical_account;
        const delta = pa?.net_change?.Forest ?? 0;
        return { label: p, value: delta >= 0 ? `+${delta.toFixed(0)}` : delta.toFixed(0) };
      });
      return { title: "Forest change by province (km²)", rows, source: "Land Accounts 2020–2023" };
    },
  },
  {
    id: "grassland_change",
    label: "Grassland",
    unit: "km²",
    trend: true,
    formula: (ctx) => {
      const m = computeClimateMetrics(ctx.provinces, ctx.landAccountsData);
      return {
        value: Math.abs(m.grasslandDelta),
        delta: m.grasslandDelta,
        formatted: Math.abs(m.grasslandDelta).toFixed(0),
      };
    },
    getDrillDown: (ctx) => {
      const rows = ctx.provinces.map((p) => {
        const pa = ctx.landAccountsData.provinces[p]?.physical_account;
        const delta = pa?.net_change?.Grassland ?? 0;
        return { label: p, value: delta >= 0 ? `+${delta.toFixed(0)}` : delta.toFixed(0) };
      });
      return { title: "Grassland change by province (km²)", rows, source: "Land Accounts 2020–2023" };
    },
  },
  {
    id: "built_up",
    label: "Built up",
    unit: "km²",
    trend: true,
    thresholds: [
      { value: 20, operator: "gte", label: "Rapid urbanization", severity: "warning" },
    ],
    formula: (ctx) => {
      const m = computeClimateMetrics(ctx.provinces, ctx.landAccountsData);
      const delta = m.builtUpDelta;
      const alert = checkThreshold(delta, [
        { value: 20, operator: "gte", label: "Rapid urbanization", severity: "warning" },
      ]);
      return {
        value: Math.abs(delta),
        delta,
        formatted: Math.abs(delta).toFixed(1),
        alert,
      };
    },
    getDrillDown: (ctx) => {
      const rows = ctx.provinces.map((p) => {
        const pa = ctx.landAccountsData.provinces[p]?.physical_account;
        const delta = pa?.net_change?.["Built Up" as LandAccountCategory] ?? 0;
        return { label: p, value: delta >= 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1) };
      });
      return { title: "Built up change by province (km²)", rows, source: "Land Accounts 2020–2023" };
    },
  },
];
