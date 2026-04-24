/**
 * Semantic colors for TS/JS inline styles.
 * Surfaces, text, and borders use CSS variables so the shell responds to the
 * theme toggle (next-themes `class="dark"` on `<html>`). Accents stay hex for
 * charts, KPI bars, and alpha-suffix patterns like `${colors.accent.red}18`.
 */
export const colors = {
  bg: {
    /** Main app / grid background */
    primary: "var(--drmis-bg-app)",
    /** Cards, panels, topbar */
    surface: "var(--drmis-bg-surface)",
    /** Inputs, nested surfaces */
    elevated: "var(--drmis-bg-elevated)",
  },
  border: {
    default: "var(--drmis-border-default)",
    strong: "var(--drmis-border-strong)",
  },
  text: {
    primary: "var(--drmis-text-primary)",
    secondary: "var(--drmis-text-secondary)",
    muted: "var(--drmis-text-muted)",
    ghost: "var(--drmis-text-ghost)",
  },
  /** Left nav — intentionally always dark (both modes). */
  sidebar: {
    bg: "var(--drmis-sidebar-bg)",
    border: "var(--drmis-sidebar-border)",
    textMuted: "var(--drmis-sidebar-text-muted)",
    textHover: "var(--drmis-sidebar-text-hover)",
    textActive: "var(--drmis-sidebar-text-active)",
    hoverBg: "var(--drmis-sidebar-hover-bg)",
    activeBg: "var(--drmis-sidebar-active-bg)",
    dotInactive: "var(--drmis-sidebar-dot-inactive)",
  },
  /** Warning copy that must read on amber-tint panels in light + dark */
  warningText: "var(--drmis-warning-text)",
  accent: {
    red: "#FF4B2B",
    amber: "#F5A623",
    green: "#30E87A",
    /** Resilience Explorer primary blue (matches --re-blue) */
    blue: "#005BB7",
  },
  /** Semantic status dots (hex — same in light/dark) */
  severity: {
    critical: "#FF4B2B",
    high: "#F5A623",
    medium: "#005BB7",
    low: "#30E87A",
  },
} as const;

export type Colors = typeof colors;
