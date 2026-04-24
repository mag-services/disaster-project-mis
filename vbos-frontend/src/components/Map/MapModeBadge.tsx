/**
 * Climate year hint on map (header + context panel already show mode; keep subtle).
 */
import { useScenario } from "@/hooks/useScenario";
import { useDateStore } from "@/store/date-store";

export function MapModeBadge() {
  const scenario = useScenario();
  const { year } = useDateStore();

  if (scenario.id !== "climate") return null;

  return (
    <div
      className="pointer-events-none absolute bottom-14 left-3 z-[990] rounded-[var(--drmis-radius-card)] border border-border/80 bg-card/90 px-2.5 py-1.5 text-[10px] font-medium leading-snug text-muted-foreground shadow-[var(--drmis-shadow-sm)] backdrop-blur-sm md:bottom-4 md:left-2"
      aria-hidden
    >
      Climate Trends • {year || new Date().getFullYear()}
    </div>
  );
}
