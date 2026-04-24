/**
 * Spacing scale (px) — t-shirt sizes for padding, gap, margin.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
} as const;

export type SpacingKey = keyof typeof spacing;
export type Spacing = typeof spacing;
