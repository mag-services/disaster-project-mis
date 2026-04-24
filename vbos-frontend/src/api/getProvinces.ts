import * as HTTP from "./http";
import { ProvincesGeoJSON } from "@/types/data";

export function getProvinces(): Promise<ProvincesGeoJSON> {
  return HTTP.get("/api/v1/provinces/").then((r) => {
    if (!r.ok) throw new Error("Unable to get provinces.");
    return r.json();
  });
}
