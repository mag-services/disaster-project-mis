import { useEffect, useReducer } from "react";

function formatRelativeSince(lastSync: Date): string {
  const ms = Date.now() - lastSync.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 5) return "Updated just now";
  if (s < 60) return `Updated ${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `Updated ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Updated ${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Updated ${d}d ago`;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Pacific/Efate",
  }).format(lastSync);
}

/**
 * Recomputes a human-readable “Updated Xs ago” string every second so duty officers
 * see live freshness without polling the clock manually.
 */
export function useLiveRelativeTime(lastSync: Date): string {
  const [, bump] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const id = window.setInterval(() => bump(), 1000);
    return () => window.clearInterval(id);
  }, [bump]);

  useEffect(() => {
    bump();
  }, [lastSync, bump]);

  return formatRelativeSince(lastSync);
}
