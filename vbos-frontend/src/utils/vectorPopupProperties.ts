/** Keys we omit from the default “show all” popup list (id is shown in the header). */
const DEFAULT_HIDDEN = new Set(["id", "ref", "metadata"]);

/**
 * Entries for map popup / tooltips / feature panel.
 * When `orderedKeys` is non-empty, only those keys are shown, in that order (missing keys skipped).
 * When empty or null/undefined, all properties except id/ref/metadata are shown.
 */
export function orderedVectorPopupEntries(
  properties: Record<string, unknown>,
  orderedKeys?: string[] | null,
): [string, unknown][] {
  if (orderedKeys != null && orderedKeys.length > 0) {
    const out: [string, unknown][] = [];
    for (const key of orderedKeys) {
      if (Object.prototype.hasOwnProperty.call(properties, key)) {
        out.push([key, properties[key]]);
      }
    }
    return out;
  }
  return Object.entries(properties).filter(([k]) => !DEFAULT_HIDDEN.has(k));
}
