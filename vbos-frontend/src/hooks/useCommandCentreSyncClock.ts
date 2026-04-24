import { useEffect, useState } from "react";

import { useLiveRelativeTime } from "./useLiveRelativeTime";

const DEFAULT_POLL_MS = 30_000;

/**
 * Timestamp for “last dashboard refresh” — updates on mount and every `pollMs`
 * (default 30s). Pair with `useLiveRelativeTime` via the returned `relativeLabel`.
 */
export function useCommandCentreSyncClock(pollMs: number = DEFAULT_POLL_MS) {
  const [lastSync, setLastSync] = useState(() => new Date());

  useEffect(() => {
    setLastSync(new Date());
    const id = window.setInterval(() => setLastSync(new Date()), pollMs);
    return () => window.clearInterval(id);
  }, [pollMs]);

  const relativeLabel = useLiveRelativeTime(lastSync);

  return { lastSync, relativeLabel };
}
