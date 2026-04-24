/**
 * Drivers layer config: Population growth, Roads, Urban expansion.
 * Matches dataset names from API - when found, layers become available.
 */
export const DRIVER_LAYER_NAMES = [
  "Population growth",
  "Roads",
  "Urban expansion",
] as const;

export type DriverName = (typeof DRIVER_LAYER_NAMES)[number];
