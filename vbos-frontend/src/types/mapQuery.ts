/**
 * POST /api/v1/ai/map-query/ — natural language → safe map plan.
 */
export type MapQueryPlan = {
  explanation: string;
  scenario: "disaster" | "climate";
  cluster: string | null;
  view_type:
    | "baseline"
    | "estimated_damage"
    | "aid_resources_needed"
    | "estimate_financial_damage"
    | null;
  year: string | null;
  provinces: string[];
  area_councils: string[];
  tabular_dataset_id: number | null;
  vector_layer_ids: number[];
  attribute_icontains: string | null;
  value_gte: number | null;
  value_lte: number | null;
};

export type MapQueryResponse = {
  plan: MapQueryPlan;
  warnings: string[];
};

/** Serializable tabular /data/ query (multi province supported). */
export type TabularApiParams = {
  provinces?: string[];
  area_councils?: string[];
  attribute?: string;
  value_gte?: string;
  value_lte?: string;
};
