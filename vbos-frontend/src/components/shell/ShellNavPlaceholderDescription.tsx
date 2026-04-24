import type { ReactNode } from "react";
import { getRoadmapTasksUrl } from "@/config/roadmap";
import { SHELL_NAV_PLACEHOLDERS } from "@/config/shellNavPlaceholders";

/**
 * Use a `<button>` (not `<a>`): Sonner’s toast swipe handler only skips `BUTTON`,
 * so links were capturing pointer events and blocking navigation.
 */
function RoadmapLink(): ReactNode {
  const url = getRoadmapTasksUrl();
  if (!url) return null;
  return (
    <button
      type="button"
      aria-label="Open DRMIS roadmap (TASKS.md) in a new tab"
      className="pointer-events-auto relative z-10 inline-flex cursor-pointer items-center gap-0.5 border-0 bg-transparent p-0 text-left text-[13px] font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
    >
      View roadmap (TASKS.md) ↗
    </button>
  );
}

/**
 * Rich toast body for shell nav items that are not built yet.
 */
export function ShellNavPlaceholderDescription({ navId }: { navId: string }): ReactNode {
  const def = SHELL_NAV_PLACEHOLDERS[navId];
  if (!def) {
    return (
      <div className="flex flex-col gap-1.5 pt-0.5 text-[13px] leading-snug">
        <p className="opacity-90">This destination is on the product roadmap.</p>
        <RoadmapLink />
      </div>
    );
  }
  return (
    <div className="flex max-w-[min(100%,22rem)] flex-col gap-1.5 pt-0.5 text-[13px] leading-snug">
      <p className="opacity-90">{def.line}</p>
      <p className="text-[12px] opacity-75">{def.eta}</p>
      <RoadmapLink />
    </div>
  );
}
