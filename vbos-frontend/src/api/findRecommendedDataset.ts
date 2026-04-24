/**
 * Finds a recommended tabular dataset for Disaster mode defaults.
 */
import { getClusters } from "./getClusters";
import { getDatasets } from "./getDatasets";
import { matchesDisasterPattern } from "@/config/recommendedDefaults";

export async function findRecommendedDisasterLayer(): Promise<string | null> {
  const clusters = await getClusters();
  for (const cluster of clusters) {
    const groups = await getDatasets(cluster.name, "disaster");
    for (const group of groups) {
      for (const d of group.datasets) {
        if (d.dataType === "tabular" && matchesDisasterPattern(d.name)) {
          return `t${d.id}`;
        }
      }
    }
  }
  return null;
}
