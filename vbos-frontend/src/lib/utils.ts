import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export type { ClassValue };

/**
 * **Typography & spacing (§1.10)** — className helper for components.
 *
 * - With **Tailwind** (this app): `clsx` for conditional classes + `tailwind-merge` so
 *   conflicting utilities collapse correctly (e.g. `p-2` + `p-4` → `p-4`).
 * - For **non-Tailwind** class strings only, you can use `clsx(inputs)` alone to avoid merge cost.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
