/**
 * Public URL for the DRMIS roadmap / TASKS.md.
 * Configure via `VITE_ROADMAP_URL`. If unset, roadmap links are hidden.
 */
export function getRoadmapTasksUrl(): string {
  const v = import.meta.env.VITE_ROADMAP_URL;
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  return "";
}
