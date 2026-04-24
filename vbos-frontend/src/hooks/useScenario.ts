/**
 * Returns the current scenario config. Use this instead of viewMode checks.
 */
import { useViewStore } from "@/store/view-store";
import { getScenario, type Scenario } from "@/config/scenarios";

export function useScenario(): Scenario {
  const scenarioId = useViewStore((s) => s.scenarioId);
  return getScenario(scenarioId);
}
