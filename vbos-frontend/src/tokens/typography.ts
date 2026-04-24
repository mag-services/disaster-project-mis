/**
 * Font stacks — Inter (Resilience Explorer–style UI); Segoe as Windows fallback.
 * Use **mono** for IDs, dates, metrics, labels, badges.
 */
export const typography = {
  display: {
    family:
      "'Inter', 'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    weights: [600, 700] as const,
  },
  body: {
    family:
      "'Inter', 'Segoe UI Variable', 'Segoe UI', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    weights: [400, 500, 600] as const,
  },
  mono: {
    family: "'Segoe UI Mono', 'Cascadia Mono', Consolas, ui-monospace, monospace",
    weights: [400, 500, 600] as const,
  },
} as const;

/** CSS `font-family` strings (ready for inline styles or CSS vars). */
export const fontFamily = {
  display: typography.display.family,
  body: typography.body.family,
  mono: typography.mono.family,
} as const;

export type Typography = typeof typography;
