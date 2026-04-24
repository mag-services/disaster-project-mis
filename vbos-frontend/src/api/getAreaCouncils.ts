import * as HTTP from "./http";
import { AreaCouncilGeoJSON } from "@/types/data";

export function getAreaCouncils(province: string): Promise<AreaCouncilGeoJSON> {
  return HTTP.get(`/api/v1/provinces/${province}/area-councils/`).then((r) => {
    if (!r.ok) throw new Error("Unable to get area councils.");
    return r.json();
  });
}
