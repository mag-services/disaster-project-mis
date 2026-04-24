import { TooltipCompat as Tooltip, TooltipProvider } from "./tooltip";

export { Tooltip, TooltipProvider };
// Intentionally export only Tooltip helpers.
// The repo contains duplicate UI primitives differing only by filename casing
// (e.g. `button.tsx` vs `Button.tsx`, `badge.tsx` vs `Badge.tsx`), which can
// cause TypeScript casing-collision errors during `tsc` builds.
