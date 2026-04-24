import { LAND_COVER_CLASS_ORDER, LAND_COVER_PIXEL_COLORS } from "@/config/landCover";

/** Distinct colors for vector point layers when multiple are active */
export const VECTOR_LAYER_COLORS = [
  "#005bb7", /* Resilience primary blue */
  "#10b981", /* emerald */
  "#f09000", /* orange */
  "#8b5cf6", /* violet */
  "#e34a33", /* red */
  "#06b6d4", /* cyan */
  "#6366f1", /* indigo */
  "#14b8a6", /* teal */
];

/** Semantic mapping: cluster name (lowercase) -> color. Education=blue, Health=emerald. */
export const VECTOR_CLUSTER_COLORS: Record<string, string> = {
  education: "#005bb7",
  health: "#10b981",
};

/**
 * Color ramp for coastal shorelines by year (QGIS-style).
 * Older years → darker; newer years → lighter. Index by (year - 2000) % length.
 */
export const COASTAL_SHORELINE_COLORS = [
  "#1e3a5f", /* 2000-2003: dark blue */
  "#2563eb", /* 2004-2007: blue */
  "#7c3aed", /* 2008-2011: violet */
  "#dc2626", /* 2012-2015: red */
  "#ea580c", /* 2016-2019: orange */
  "#ca8a04", /* 2020-2023: amber */
  "#16a34a", /* 2024+: green */
  "#0d9488", /* fallback: teal */
];

/** Get color for coastal shoreline by year. Cycles through palette for temporal distinction. */
export function getCoastalShorelineColor(year: number | string | null | undefined): string {
  if (year == null || year === "") return COASTAL_SHORELINE_COLORS[0];
  const y = typeof year === "string" ? parseInt(year, 10) : year;
  if (Number.isNaN(y)) return COASTAL_SHORELINE_COLORS[0];
  const idx = Math.abs(y - 2000) % COASTAL_SHORELINE_COLORS.length;
  return COASTAL_SHORELINE_COLORS[idx] ?? COASTAL_SHORELINE_COLORS[0];
}

const mapColors = {
  blueLight: "#22d3ee",
  blue: "#005bb7",
  purple: "#8b5cf6",
  orange: "#f09000",
  red: "#e34a33",
  /** Choropleth: low (light green) -> high (dark green) */
  choroplethLow: "#bbf7d0",
  choroplethMid: "#22c55e",
  choroplethHigh: "#15803d",
  choroplethMax: "#14532d",
};

/** Theme-aware map colors: province border, area council border, choropleth */
export const MAP_COLORS = {
  light: {
    provinceBorder: "#0891b2",
    areaCouncilBorder: "#dc2626",
    choroplethLow: "#bbf7d0",
    choroplethMid: "#22c55e",
    choroplethHigh: "#15803d",
    choroplethMax: "#14532d",
    deltaNeg: "#dc2626",
    deltaZero: "#64748b",
    deltaPos: "#16a34a",
  },
  dark: {
    provinceBorder: "#22d3ee",
    areaCouncilBorder: "#f87171",
    choroplethLow: "#86efac",
    choroplethMid: "#22c55e",
    choroplethHigh: "#166534",
    choroplethMax: "#052e16",
    deltaNeg: "#f87171",
    deltaZero: "#94a3b8",
    deltaPos: "#4ade80",
  },
} as const;

export type MapPalette = (typeof MAP_COLORS)[keyof typeof MAP_COLORS];

/** Interpolate hex color between low and high based on t (0-1) */
function lerpHex(low: string, high: string, t: number): string {
  const parse = (h: string) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = parse(low);
  const [r2, g2, b2] = parse(high);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Get choropleth fill color: low values -> cyan/emerald, high -> purple/red */
export function getChoroplethColor(t: number, palette?: MapPalette): string {
  const p = palette ?? MAP_COLORS.light;
  if (t <= 0) return p.choroplethLow;
  if (t >= 1) return p.choroplethMax;
  if (t < 0.5) {
    return lerpHex(p.choroplethLow, p.choroplethMid, t * 2);
  }
  return lerpHex(p.choroplethMid, p.choroplethMax, (t - 0.5) * 2);
}

/** Get delta heatmap color: t in [-1, 1] where -1 = max negative, 0 = no change, 1 = max positive */
export function getDeltaColor(t: number, palette?: MapPalette): string {
  const p = palette ?? MAP_COLORS.light;
  if (t <= -1) return p.deltaNeg;
  if (t >= 1) return p.deltaPos;
  if (t < 0) return lerpHex(p.deltaZero, p.deltaNeg, -t);
  return lerpHex(p.deltaZero, p.deltaPos, t);
}

/* Data viz: Resilience blue first, then emerald/indigo/purple */
const chartColors = [
  "#005bb7", /* Resilience primary */
  "#10b981", /* emerald-500 */
  "#5f7d95", /* muted slate (reference UI) */
  "#6366f1", /* indigo-500 */
  "#8b5cf6", /* violet-500 */
  "#06b6d4", /* cyan-500 */
  "#14b8a6", /* teal-500 */
  "#818cf8", /* indigo-400 */
  "#a78bfa", /* violet-400 */
  "#22d3ee", /* cyan-400 */
];

/** Softer palette for line charts (light blue, darker blue/purple like reference) */
export const lineChartColors = [
  "#38bdf8", /* sky-400 - light blue */
  "#005bb7", /* Resilience primary */
  "#6366f1", /* indigo-500 */
  "#06b6d4", /* cyan-500 */
  "#8b5cf6", /* violet-500 */
  "#14b8a6", /* teal-500 */
  "#818cf8", /* indigo-400 */
];

/**
 * TiTiler colormap for categorical land cover raster (explicit value→color).
 * Use in titiler_url_params: colormap=JSON.stringify(LAND_COVER_COLORMAP)
 * Pixel values 0–5 map to the 6 classes (order matches LAND_COVER_CLASS_ORDER).
 * Use getLandCoverColormap(hiddenClasses) to get a colormap with hidden classes as transparent.
 */
export const LAND_COVER_COLORMAP = LAND_COVER_PIXEL_COLORS;

/** Transparent color for hidden land cover classes */
const LAND_COVER_TRANSPARENT = "#00000000";

/** Build colormap with hidden classes (by type name) rendered transparent */
export function getLandCoverColormap(hiddenClasses: Set<string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (let i = 0; i < LAND_COVER_CLASS_ORDER.length; i++) {
    const pixel = String(i);
    const typeName = LAND_COVER_CLASS_ORDER[i];
    result[pixel] = hiddenClasses.has(typeName)
      ? LAND_COVER_TRANSPARENT
      : (LAND_COVER_PIXEL_COLORS[pixel] ?? "#888");
  }
  return result;
}

/** Land cover types: theme-aware palette (colorblind-safe) */
export const LAND_COVER_COLORS = {
  light: {
    "Dense Forest": "#2E7D32",
    "Open Forest": "#66BB6A",
    Mangrove: "#388E3C",
    Agriculture: "#FBC02D",
    "Coconut plantations": "#FFB300",
    Grassland: "#CDDC39",
    Barelands: "#A1887F",
    "Builtup Infrastructure": "#757575",
    "Water bodies": "#42A5F5",
    // Land Accounts 6-category scheme
    "Water Bodies": "#42A5F5",
    "Built Up": "#757575",
    Bareland: "#A1887F",
    Forest: "#2E7D32",
  } as Record<string, string>,
  dark: {
    "Dense Forest": "#66BB6A",
    "Open Forest": "#A5D6A7",
    Mangrove: "#81C784",
    Agriculture: "#FFF176",
    "Coconut plantations": "#FFE082",
    Grassland: "#E6EE9C",
    Barelands: "#BCAAA4",
    "Builtup Infrastructure": "#B0BEC5",
    "Water bodies": "#90CAF9",
    // Land Accounts 6-category scheme
    "Water Bodies": "#90CAF9",
    "Built Up": "#B0BEC5",
    Bareland: "#BCAAA4",
    Forest: "#66BB6A",
  } as Record<string, string>,
};

export { mapColors, chartColors };

/** Opaque tooltip style for Recharts – use var(--card) not hsl(var(--card)) since --card is hex */
export const chartTooltipContentStyle: Record<string, string | number> = {
  backgroundColor: "var(--card)",
  color: "var(--card-foreground)",
  border: "1px solid var(--border)",
  borderRadius: "6px",
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  opacity: 1,
};

/** Wrapper must also have solid background – Recharts applies wrapperStyle to outer div */
export const chartTooltipWrapperStyle: Record<string, string | number> = {
  backgroundColor: "var(--card)",
  opacity: 1,
};
