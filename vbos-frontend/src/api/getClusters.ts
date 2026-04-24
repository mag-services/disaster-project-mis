import * as HTTP from "./http";
import { ICluster, IListApiResponse } from "@/types/api";

export function getClusters(): Promise<ICluster[]> {
  return HTTP.get("/api/v1/cluster/?page_size=100").then(async (r) => {
    if (!r.ok) throw new Error("Unable to get clusters.");
    const data: IListApiResponse<ICluster> = await r.json();
    return data.results;
  });
}
