/**
 * Land cover config – 6-class QGIS scheme (pixel values 0–5).
 * Matches generate_raster_tiles.sh and backend PIXEL_TO_CLASS.
 * QGIS: 0=Water Bodies, 1=Grassland, 2=Mangrove, 3=Bareland, 4=Built Up, 5=Forest
 */
export const LAND_COVER_PIXEL_TO_CLASS: Record<string, string> = {
  "0": "Water Bodies",
  "1": "Grassland",
  "2": "Mangrove",
  "3": "Bareland",
  "4": "Built Up",
  "5": "Forest",
};

export const LAND_COVER_CLASS_ORDER = [
  "Water Bodies",
  "Grassland",
  "Mangrove",
  "Bareland",
  "Built Up",
  "Forest",
] as const;

/** Pixel values for stats/chart lookup (0-based) */
export const LAND_COVER_PIXEL_VALUES = [0, 1, 2, 3, 4, 5] as const;

/** Colors match generate_raster_tiles.sh landcover_colors.txt */
export const LAND_COVER_PIXEL_COLORS: Record<string, string> = {
  "0": "#3498DB",
  "1": "#CDDC39",
  "2": "#2E7D32",
  "3": "#A1887F",
  "4": "#757575",
  "5": "#388E3C",
};
