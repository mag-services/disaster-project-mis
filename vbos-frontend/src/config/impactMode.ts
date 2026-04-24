/**
 * Impact Mode: attribute name patterns for hazard, population, infrastructure.
 * Used to compute estimated affected population from tabular data.
 */
export const POPULATION_ATTR_PATTERNS = [
  "population",
  "pop",
  "people",
  "inhabitants",
] as const;

export const HAZARD_ATTR_PATTERNS = [
  "hazard",
  "cyclone",
  "exposure",
  "estimated_damage",
  "estimated damage",
  "damage",
  "risk",
] as const;

export const INFRASTRUCTURE_ATTR_PATTERNS = [
  "infrastructure",
  "built",
  "settlements",
  "roads",
] as const;

function matchesPattern(str: string, patterns: readonly string[]): boolean {
  const lower = str.toLowerCase().replace(/_/g, " ");
  return patterns.some((p) => lower.includes(p));
}

export function isPopulationAttr(attr: string): boolean {
  return matchesPattern(attr, POPULATION_ATTR_PATTERNS as unknown as string[]);
}

export function isHazardAttr(attr: string): boolean {
  return matchesPattern(attr, HAZARD_ATTR_PATTERNS as unknown as string[]);
}

export function isInfrastructureAttr(attr: string): boolean {
  return matchesPattern(attr, INFRASTRUCTURE_ATTR_PATTERNS as unknown as string[]);
}
