export interface ShellNavPlaceholder {
  /** Toast title — feature name (not “Coming soon”). */
  title: string;
  /** What this area will do for users. */
  line: string;
  /** Rough ETA / phase from TASKS.md so duty officers know it’s planned. */
  eta: string;
}

export const SHELL_NAV_PLACEHOLDERS: Record<string, ShellNavPlaceholder> = {};

export function getShellNavPlaceholder(id: string): ShellNavPlaceholder | undefined {
  return SHELL_NAV_PLACEHOLDERS[id];
}
