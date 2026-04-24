/**
 * Resilience Explorer (Vanuatu / Urban Intelligence) reference — mirrors `src/index.css` `--re-*`.
 * Aligned to product screenshot: deep navy sidebar, #005bb7 primary, accordion #003366.
 */
export const resiliencePalette = {
  /** Deep navy — left nav (always dark) */
  navy: "#001b3d",
  /** Primary action / tabs / links (Resilience primary blue) */
  blue: "#005bb7",
  /** Page background */
  bgApp: "#f5f7fa",
  /** Section / tool bar (e.g. scenario controls) */
  bgSection: "#cad6e2",
  /** Accordion / panel headers (dark blue bar) */
  accordion: "#003366",
  border: "#d1d9e0",
  text: "#1a1a1a",
  textMuted: "#5f7d95",
  /** Note / callout */
  noteBg: "#fff9e6",
  noteBorder: "#ffcc00",
  /** Sidebar active row — light pill on navy (screenshot style) */
  sidebarActive: "#e8eef4",
} as const;

export type ResiliencePalette = typeof resiliencePalette;
