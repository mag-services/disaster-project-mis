/**
 * SVG icon definitions for vector point layers.
 * Each icon is a 24x24 viewBox SVG, designed to be colored via fill/stroke.
 *
 * Map markers use a **location pin** shell (white fill, category-colored stroke)
 * with the chosen icon scaled inside the pin head — Resilience Explorer / GIS style.
 */

/** Full marker dimensions (Leaflet divIcon) */
export const VECTOR_PIN_MARKER_SIZE: [number, number] = [48, 56];
/** Anchor at bottom tip of pin */
export const VECTOR_PIN_MARKER_ANCHOR: [number, number] = [24, 56];

const PIN_W = 48;
const PIN_H = 56;
/** Center of inner glyph area (bulb of pin) */
const PIN_CX = 24;
const PIN_CY = 19;
/** Scale Lucide 24×24 paths to fit inside pin head */
const INNER_ICON_SCALE = 0.52;

/**
 * Teardrop map pin outline (viewBox 0 0 48 56). Stroke uses category `color`.
 */
const PIN_BODY_PATH = `
M24 3.5
C13.5 3.5 5.5 11.8 5.5 22.2
C5.5 32.5 24 52.2 24 52.2
S42.5 32.5 42.5 22.2
C42.5 11.8 34.5 3.5 24 3.5
Z`.replace(/\s+/g, " ");

/** Inner white disc (optional ring) so glyphs read clearly */
const PIN_INNER_RING = `<circle cx="${PIN_CX}" cy="${PIN_CY}" r="10.5" fill="#ffffff" stroke="currentColor" stroke-width="1.15"/>`;

const stroke =
  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

/** SVG path data for each icon type. Paths from Lucide (lucide.dev). */
export const VECTOR_ICON_PATHS: Record<string, string> = {
  circle: '<circle cx="12" cy="12" r="6" fill="currentColor"/>',
  graduationCap:
    `<path d="M22 10v6M2 10l10-5.5L22 10l-10 5.5L2 10z" ${stroke}/>` +
    `<path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" ${stroke}/>`,
  cross: `<path d="M12 5v14M5 12h14" ${stroke}/>`,
  mapPin:
    `<path d="M18 8c0 4.5-6 12-6 12s-6-7.5-6-12a6 6 0 0 1 12 0Z" ${stroke}/>` +
    '<circle cx="12" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/>',
  building:
    `<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" ${stroke}/>` +
    '<path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 8h.01M10 8h.01M14 8h.01M18 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  square: '<rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor"/>',
  triangle:
    '<path d="M12 4 4 20h16L12 4z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
  star:
    '<path d="m12 2 3 7 7 1-5 5 1.5 7L12 17l-6.5 3.5L8 15l-5-5 7-1 3-7z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
  // Lucide icons
  droplet: `<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" ${stroke}/>`,
  school:
    `<path d="M14 21v-3a2 2 0 0 0-4 0v3" ${stroke}/>` +
    `<path d="M18 5v16" ${stroke}/>` +
    `<path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6" ${stroke}/>` +
    `<path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11" ${stroke}/>` +
    `<path d="M6 5v16" ${stroke}/>` +
    '<circle cx="12" cy="9" r="2" fill="none" stroke="currentColor" stroke-width="2"/>',
  hospital:
    `<path d="M12 7v4" ${stroke}/>` +
    `<path d="M14 21v-3a2 2 0 0 0-4 0v3" ${stroke}/>` +
    `<path d="M14 9h-4" ${stroke}/>` +
    `<path d="M18 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2h2" ${stroke}/>` +
    `<path d="M18 21V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16" ${stroke}/>`,
  heart: `<path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" ${stroke}/>`,
  bookOpen:
    `<path d="M12 7v14" ${stroke}/>` +
    `<path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" ${stroke}/>`,
  tent:
    `<path d="M3.5 21 14 3" ${stroke}/>` +
    `<path d="M20.5 21 10 3" ${stroke}/>` +
    `<path d="M15.5 21 12 15l-3.5 6" ${stroke}/>` +
    `<path d="M2 21h20" ${stroke}/>`,
  treePine:
    `<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" ${stroke}/>` +
    `<path d="M12 22v-3" ${stroke}/>`,
  factory:
    `<path d="M12 16h.01" ${stroke}/>` +
    `<path d="M16 16h.01" ${stroke}/>` +
    `<path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" ${stroke}/>` +
    `<path d="M8 16h.01" ${stroke}/>`,
  landmark:
    `<path d="M10 18v-7" ${stroke}/>` +
    `<path d="M11.12 2.198a2 2 0 0 1 1.76.006l7.866 3.847c.476.233.31.949-.22.949H3.474c-.53 0-.695-.716-.22-.949z" ${stroke}/>` +
    `<path d="M14 18v-7" ${stroke}/>` +
    `<path d="M18 18v-7" ${stroke}/>` +
    `<path d="M3 22h18" ${stroke}/>` +
    `<path d="M6 18v-7" ${stroke}/>`,
};

/** Icon keys in order - used for index-based assignment */
export const VECTOR_ICON_KEYS = [
  "graduationCap",
  "cross",
  "mapPin",
  "droplet",
  "school",
  "hospital",
  "heart",
  "bookOpen",
  "building",
  "tent",
  "treePine",
  "factory",
  "landmark",
  "square",
  "triangle",
  "star",
  "circle",
] as const;

export type VectorIconKey = (typeof VECTOR_ICON_KEYS)[number];

/** Humanitarian cluster -> icon (Lucide key or Flaticon class) */
const CLUSTER_ICON_MAP: Record<string, VectorIconKey | string> = {
  education: "graduationCap",
  health: "cross",
  wash: "droplet",
  emergency: "fi-sr-broadcast-tower",
  energy: "fi-sr-bolt",
  food: "fi-sr-utensils",
  gender: "fi-sr-users",
  logistics: "fi-sr-truck-moving",
  shelter: "fi-sr-shield",
  business: "fi-sr-briefcase",
};

/** Flaticon icon format (fi-sr-*, fi-rr-*, etc.) */
const FLATICON_PREFIX = "fi-";

/** Get icon key from dataset icon, cluster name, or fallback to index */
export function getVectorIconKey(
  index: number,
  cluster?: string | null,
  datasetIcon?: string | null,
): VectorIconKey | string {
  if (datasetIcon) {
    if (datasetIcon.startsWith(FLATICON_PREFIX)) {
      return datasetIcon;
    }
    if ((VECTOR_ICON_KEYS as readonly string[]).includes(datasetIcon)) {
      return datasetIcon as VectorIconKey;
    }
  }
  if (cluster) {
    const key = CLUSTER_ICON_MAP[cluster.toLowerCase().trim()];
    if (key) return key;
  }
  return VECTOR_ICON_KEYS[index % VECTOR_ICON_KEYS.length];
}

function buildInnerGlyphSvg(color: string, iconKey: VectorIconKey | string): string {
  const path = VECTOR_ICON_PATHS[iconKey as VectorIconKey] ?? VECTOR_ICON_PATHS.circle;
  return path.replace(/currentColor/g, color);
}

/** Pin geometry + inner Lucide glyph (paths only; wrap in svg for full marker). */
function buildPinLucideBody(color: string, iconKey: VectorIconKey | string): string {
  const glyph = buildInnerGlyphSvg(color, iconKey);
  const g = `<g transform="translate(${PIN_CX} ${PIN_CY}) scale(${INNER_ICON_SCALE}) translate(-12 -12)">${glyph}</g>`;
  return `<path d="${PIN_BODY_PATH.trim()}" fill="#ffffff" stroke="${color}" stroke-width="2.25" stroke-linejoin="round"/>
  ${PIN_INNER_RING.replace(/currentColor/g, color)}
  ${g}`;
}

/**
 * Full pin SVG (viewBox 0 0 48 56) with inner Lucide paths only.
 */
function buildPinSvgWithLucideIcon(color: string, iconKey: VectorIconKey | string): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIN_W} ${PIN_H}" width="${PIN_W}" height="${PIN_H}" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.22))" aria-hidden="true">
  ${buildPinLucideBody(color, iconKey)}
</svg>`.trim();
}

/**
 * Pin + Flaticon: SVG shell + absolutely positioned icon in the bulb.
 */
function buildPinHtmlWithFlaticon(color: string, iconKey: string, opacity: number): string {
  const fiSize = 15;
  const topPx = 11;
  return `
<div class="vector-marker-pin-wrap" style="position:relative;width:${PIN_W}px;height:${PIN_H}px;opacity:${opacity}">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIN_W} ${PIN_H}" width="${PIN_W}" height="${PIN_H}" style="display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.22))" aria-hidden="true">
    <path d="${PIN_BODY_PATH.trim()}" fill="#ffffff" stroke="${color}" stroke-width="2.25" stroke-linejoin="round"/>
    ${PIN_INNER_RING.replace(/currentColor/g, color)}
  </svg>
  <div style="position:absolute;left:50%;top:${topPx}px;transform:translateX(-50%);width:24px;height:24px;display:flex;align-items:center;justify-content:center;pointer-events:none">
    <i class="fi ${iconKey}" style="color:${color};font-size:${fiSize}px;line-height:1"></i>
  </div>
</div>`.trim();
}

/** Build SVG or Flaticon HTML for legend display (React dangerouslySetInnerHTML) */
export function buildVectorIconSvg(
  color: string,
  iconKey: VectorIconKey | string,
  size = 16,
): string {
  if (typeof iconKey === "string" && iconKey.startsWith(FLATICON_PREFIX)) {
    return `<i class="fi ${iconKey}" style="color:${color};font-size:${size}px;display:inline-block;width:${size}px;height:${size}px;line-height:${size}px;text-align:center"></i>`;
  }
  const path = VECTOR_ICON_PATHS[iconKey as VectorIconKey] ?? VECTOR_ICON_PATHS.circle;
  const coloredPath = path.replace(/currentColor/g, color);
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}">${coloredPath}</svg>`;
}

/**
 * Legend / UI: same location-pin look, scaled down (keeps aspect ratio).
 */
export function buildVectorPinIconSvg(
  color: string,
  iconKey: VectorIconKey | string,
  heightPx = 24,
): string {
  const w = Math.round(heightPx * (PIN_W / PIN_H));
  if (typeof iconKey === "string" && iconKey.startsWith(FLATICON_PREFIX)) {
    const top = Math.round((11 / PIN_H) * heightPx);
    const fs = Math.max(8, Math.round((15 / PIN_H) * heightPx));
    return `<div style="position:relative;width:${w}px;height:${heightPx}px;display:inline-block;vertical-align:middle">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIN_W} ${PIN_H}" width="${w}" height="${heightPx}" style="display:block">
        <path d="${PIN_BODY_PATH.trim()}" fill="#ffffff" stroke="${color}" stroke-width="2.25" stroke-linejoin="round"/>
        ${PIN_INNER_RING.replace(/currentColor/g, color)}
      </svg>
      <div style="position:absolute;left:50%;top:${top}px;transform:translateX(-50%);display:flex;align-items:center;justify-content:center">
        <i class="fi ${iconKey}" style="color:${color};font-size:${fs}px;line-height:1"></i>
      </div>
    </div>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PIN_W} ${PIN_H}" width="${w}" height="${heightPx}" style="display:block;vertical-align:middle;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.18))">${buildPinLucideBody(color, iconKey)}</svg>`;
}

/**
 * Builds a self-contained 3D perspective pin SVG for use in MapLibre symbol layers.
 *
 * Design language:
 *  - Radial gradient on the bulb: bright highlight top-left, deep shade bottom-right
 *  - Narrow tapered stem with depth shading
 *  - Soft drop-shadow ellipse beneath the tip (ground shadow)
 *  - Inner disc uses a gradient so the icon sits in a lit recess
 *  - All in a single 56×72 viewBox (taller than 2D to give shadow room at base)
 */
export function build3DPinSvg(color: string, iconKey: VectorIconKey | string): string {
  const W = 56;
  const H = 72;
  // Bulb center
  const CX = 28;
  const CY = 22;
  const R = 19;           // bulb radius
  const STEM_TIP_Y = 65;  // bottom of stem (tip)

  // Derive shade / highlight colours from the category colour
  const id = `pin3d-${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Stem: a narrow tapered triangle from bottom of bulb to tip
  const stemPath = `
    M${CX - 5.5} ${CY + R - 4}
    Q${CX - 3} ${CY + R + 10} ${CX} ${STEM_TIP_Y}
    Q${CX + 3} ${CY + R + 10} ${CX + 5.5} ${CY + R - 4}
    Z
  `.trim();

  const glyph = (() => {
    const path = VECTOR_ICON_PATHS[iconKey as VectorIconKey] ?? VECTOR_ICON_PATHS.circle;
    const scale = 0.58;
    return `<g transform="translate(${CX} ${CY}) scale(${scale}) translate(-12 -12)">${path.replace(/currentColor/g, "#fff")}</g>`;
  })();

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
    viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block" aria-hidden="true">
  <defs>
    <!-- Bulb 3D radial gradient: highlight top-left, shade bottom-right -->
    <radialGradient id="${id}-bulb" cx="36%" cy="28%" r="65%" fx="36%" fy="28%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="45%"  stop-color="${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="1">
        <animate attributeName="stop-color" dur="0s" fill="freeze"/>
      </stop>
    </radialGradient>
    <!-- Shade overlay: darkens the lower-right for depth -->
    <radialGradient id="${id}-shade" cx="72%" cy="75%" r="60%">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <!-- Inner disc gradient: lit recess -->
    <radialGradient id="${id}-disc" cx="40%" cy="35%" r="65%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#f0f0f0" stop-opacity="0.85"/>
    </radialGradient>
    <!-- Stem gradient: lit left, dark right -->
    <linearGradient id="${id}-stem" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="40%"  stop-color="${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
    </linearGradient>
    <!-- Drop shadow filter -->
    <filter id="${id}-shadow" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.30"/>
    </filter>
  </defs>

  <!-- Ground shadow ellipse -->
  <ellipse cx="${CX}" cy="${STEM_TIP_Y + 2}" rx="7" ry="3"
    fill="#000000" fill-opacity="0.18"/>

  <!-- Stem -->
  <path d="${stemPath}"
    fill="url(#${id}-stem)"
    filter="url(#${id}-shadow)"/>
  <!-- Stem right-edge darkening -->
  <path d="${stemPath}"
    fill="none" stroke="${color}" stroke-width="0.5" opacity="0.5"/>

  <!-- Bulb base fill with category colour -->
  <circle cx="${CX}" cy="${CY}" r="${R}"
    fill="${color}"
    filter="url(#${id}-shadow)"/>
  <!-- Bulb 3D gradient overlay -->
  <circle cx="${CX}" cy="${CY}" r="${R}"
    fill="url(#${id}-bulb)"/>
  <!-- Depth shade overlay -->
  <circle cx="${CX}" cy="${CY}" r="${R}"
    fill="url(#${id}-shade)"/>
  <!-- Thin rim -->
  <circle cx="${CX}" cy="${CY}" r="${R}"
    fill="none" stroke="${color}" stroke-width="1.2" opacity="0.6"/>

  <!-- Inner lit disc -->
  <circle cx="${CX}" cy="${CY}" r="${R * 0.54}"
    fill="url(#${id}-disc)"/>

  <!-- Category icon -->
  ${glyph}
</svg>`.trim();
}

/** Build Leaflet DivIcon HTML for a vector point marker (location pin + category icon) */
export function buildVectorMarkerIcon(
  color: string,
  iconKey: VectorIconKey | string,
  opacity: number,
): string {
  if (typeof iconKey === "string" && iconKey.startsWith(FLATICON_PREFIX)) {
    return buildPinHtmlWithFlaticon(color, iconKey, opacity);
  }
  return `<div class="vector-marker-icon" style="width:${PIN_W}px;height:${PIN_H}px;display:flex;align-items:center;justify-content:center;opacity:${opacity}">${buildPinSvgWithLucideIcon(color, iconKey)}</div>`;
}
