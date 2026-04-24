/**
 * Cyclone intensity categories and colors for map legend.
 * Matches RAP export: intensity_color in GeoJSON/PMTiles.
 */
export const CYCLONE_INTENSITY_LEGEND = [
  { label: "No intensity (0)", color: "#cccccc" },
  { label: "Category 2", color: "#fbbf24" },
  { label: "Category 3", color: "#f97316" },
  { label: "Category 4", color: "#dc2626" },
  { label: "Category 5", color: "#7f1d1d" },
] as const;

/** Parse intensity value to rank (0–5). Higher = stronger. */
export function parseIntensityRank(value: string | number): number {
  if (value === "" || value == null) return 0;
  const s = String(value).toLowerCase();
  const m = s.match(/(?:cat(?:egory)?\s*)?(\d)/);
  if (m) return Math.min(5, Math.max(0, parseInt(m[1], 10)));
  const n = parseInt(String(value), 10);
  if (!Number.isNaN(n)) return Math.min(5, Math.max(0, n));
  return 0;
}

/** Get highest intensity from rows. Returns { label, color } or null if none. */
export function getHighestIntensity(
  rows: { intensity: string | number; intensityColor?: string }[],
): { label: string; color: string } | null {
  if (!rows.length) return null;
  let best: { rank: number; label: string; color: string } | null = null;
  for (const r of rows) {
    const rank = parseIntensityRank(r.intensity);
    if (rank > 0 && (!best || rank > best.rank)) {
      const label =
        String(r.intensity).trim() ||
        CYCLONE_INTENSITY_LEGEND.find((l) => l.label.includes(String(rank)))?.label ||
        `Category ${rank}`;
      best = {
        rank,
        label,
        color: r.intensityColor || CYCLONE_INTENSITY_LEGEND.find((l) => l.label.includes(String(rank)))?.color || "#cccccc",
      };
    }
  }
  return best ? { label: best.label, color: best.color } : null;
}

/**
 * Disaster overlay config. All hazards listed here appear in the UI;
 * disabled until admin uploads a matching dataset (by name) in the backend.
 * Shown when Data view is Damage, Resources, or Financial (not Baseline).
 */
export const DISASTER_LAYER_NAMES = [
  "Cyclone Intensity",
  "Volcano",
  "Flood",
  "Earthquake",
  "Tsunami",
  "Landslide",
  "Drought",
  "Wildfire",
] as const;

export type DisasterLayerName = (typeof DISASTER_LAYER_NAMES)[number];
