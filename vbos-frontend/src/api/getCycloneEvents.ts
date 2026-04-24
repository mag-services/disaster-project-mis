import * as HTTP from "./http";
import { ICycloneEvent } from "@/types/api";

export function getCycloneEvents(): Promise<ICycloneEvent[]> {
  return HTTP.get("/api/v1/cyclone-events/").then(async (r) => {
    if (!r.ok) throw new Error("Unable to fetch cyclone events.");
    return r.json() as Promise<ICycloneEvent[]>;
  });
}
