/**
 * Climate dashboard placeholder. Shown when Climate mode is active.
 * Lists planned features; all outputs generated — layout to be adjusted for one dashboard.
 */
import { LuLeaf } from "react-icons/lu";
import { cn } from "@/lib/utils";

const PLANNED_FEATURES = [
  "Land Use / Land Cover Classification",
  "Coastal changes",
  "Assessing Flood Risk from Past Weather",
  "Climate indicators",
  "Marine heat waves",
  "Coral reef mapping",
  "Soil health",
];

export function ClimatePlaceholderPopover() {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center bg-muted/30",
      )}
    >
      <div
        className={cn(
          "w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-4 shadow-md",
        )}
      >
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <LuLeaf className="size-4 shrink-0" />
          Climate dashboard — coming soon
        </div>
        <p className="mb-2 text-sm font-medium text-foreground">
          Here will be implemented:
        </p>
        <ul className="mb-3 space-y-1.5 text-sm text-muted-foreground">
          {PLANNED_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/50" />
              {feature}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          The dashboard is being refined to bring all climate insights together
          in one view.
        </p>
      </div>
    </div>
  );
}
