import { post } from "./http";
import type { MapQueryResponse } from "@/types/mapQuery";

const API_BASE = "/api/v1";

/**
 * POST natural-language query; returns a safe plan for the client to apply.
 */
export async function postMapQuery(query: string): Promise<MapQueryResponse> {
  const trimmed = query.trim();
  const res = await post(`${API_BASE}/ai/map-query/`, { query: trimmed });
  if (res.status === 503) {
    throw new Error(
      "Map query assistant is not configured on the server (missing OpenAI API key).",
    );
  }
  if (res.status === 502) {
    const body = await res.json().catch(() => ({}));
    const detail =
      typeof body.detail === "string" ? body.detail : "Language model request failed.";
    throw new Error(detail);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (body.errors?.query?.[0]) message = body.errors.query[0];
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<MapQueryResponse>;
}
