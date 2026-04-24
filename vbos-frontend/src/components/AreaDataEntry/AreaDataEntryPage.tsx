/**
 * Area Administrator data entry page.
 * Enter tabular data for assigned areas → Submit → VBoS approves → appears in MIS.
 * Loads existing baseline data and adds a column for new year input instead of guessing attributes.
 */
import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiStore } from "@/store/ui-store";
import {
  getAreaAdminAreas,
  getAreaSubmissions,
  createAreaSubmission,
  updateAreaSubmission,
  submitAreaSubmission,
  offlineDraftToDisplay,
  type AreaSubmission,
  type AreaSubmissionItem,
  type CreateSubmissionPayload,
  type LocalDraftDisplay,
} from "@/api/areaSubmissions";
import { getDatasetData } from "@/api/getDatasets";
import * as HTTP from "@/api/http";
import type { TabularData } from "@/types/api";
import {
  saveOfflineDraft,
  updateOfflineDraft,
  deleteOfflineDraft,
  getOfflineDrafts,
  getCachedAreas,
  setCachedAreas,
  getCachedDatasets,
  setCachedDatasets,
} from "@/lib/offlineStorage";
import { useOfflineStore } from "@/store/offline-store";
import { LuArrowLeft, LuPlus, LuSend, LuTrash2 } from "react-icons/lu";
import { toast } from "@/utils/toast";
import { cn } from "@/lib/utils";

const API_BASE = "/api/v1";

async function getTabularDatasets(): Promise<{ id: number; name: string }[]> {
  const res = await HTTP.get(`${API_BASE}/tabular/?page_size=200`);
  if (!res.ok) throw new Error("Failed to fetch datasets");
  const data = await res.json();
  const results = data.results ?? (Array.isArray(data) ? data : []);
  return results.map((d: { id: number; name: string }) => ({ id: d.id, name: d.name }));
}

async function getAreaAdminAreasCached(): Promise<Awaited<ReturnType<typeof getAreaAdminAreas>>> {
  try {
    const areas = await getAreaAdminAreas();
    await setCachedAreas(areas);
    return areas;
  } catch {
    const cached = await getCachedAreas();
    if (cached) return cached as Awaited<ReturnType<typeof getAreaAdminAreas>>;
    throw new Error("Go online to load areas");
  }
}

async function getTabularDatasetsCached(): Promise<{ id: number; name: string }[]> {
  try {
    const datasets = await getTabularDatasets();
    await setCachedDatasets(datasets);
    return datasets;
  } catch {
    const cached = await getCachedDatasets();
    if (cached) return cached as { id: number; name: string }[];
    return [];
  }
}

async function getSubmissionsWithOffline(
  areas: Awaited<ReturnType<typeof getAreaAdminAreas>>,
  datasets: { id: number; name: string }[],
): Promise<(AreaSubmission | LocalDraftDisplay)[]> {
  let server: AreaSubmission[] = [];
  try {
    server = await getAreaSubmissions();
  } catch {
    // Offline or error – use local drafts only
  }
  const local = await getOfflineDrafts();
  const localDisplay = local.map((d) => offlineDraftToDisplay(d, areas, datasets));
  const byKey = new Map<string, AreaSubmission | LocalDraftDisplay>();
  for (const s of server) byKey.set(`server-${s.id}`, s);
  for (const s of localDisplay) byKey.set(s.id, s);
  return [...byKey.values()].sort((a, b) => {
    const aDate = "created" in a ? a.created : "";
    const bDate = "created" in b ? b.created : "";
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

/** Build attribute rows from tabular data: attribute → year → value. */
function buildBaselineRows(
  results: TabularData[],
  _newYear: number,
  existingItems?: AreaSubmissionItem[],
): { attribute: string; byYear: Record<number, number>; newValue: number }[] {
  const byAttr: Record<string, Record<number, number>> = {};
  for (const r of results) {
    const attr = (r.attribute ?? "").trim();
    if (!attr) continue;
    const year = r.date ? new Date(r.date).getFullYear() : 0;
    if (!year) continue;
    if (!byAttr[attr]) byAttr[attr] = {};
    byAttr[attr][year] = Number(r.value) ?? 0;
  }
  const attrsFromData = [...new Set(Object.keys(byAttr))].sort();
  const attrsFromExisting = (existingItems ?? [])
    .map((i) => i.attribute.trim())
    .filter(Boolean);
  const allAttrs = [...new Set([...attrsFromData, ...attrsFromExisting])].sort();
  return allAttrs.map((attribute) => {
    const existing = existingItems?.find((i) => i.attribute === attribute);
    return {
      attribute,
      byYear: byAttr[attribute] ?? {},
      newValue: existing ? existing.value : 0,
    };
  });
}

export function AreaDataEntryPage() {
  const setDataEntryPageOpen = useUiStore((s) => s.setDataEntryPageOpen);
  const queryClient = useQueryClient();
  const incrementQueued = useOfflineStore((s) => s.incrementQueued);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateSubmissionPayload>({
    dataset: 0,
    province: 0,
    area_council: null,
    year: CURRENT_YEAR,
    items: [{ attribute: "", value: 0 }],
  });

  const { data: areas, isLoading: areasLoading, error: areasError } = useQuery({
    queryKey: ["area-admin-areas"],
    queryFn: getAreaAdminAreasCached,
    retry: false,
  });

  const { data: datasets = [] } = useQuery({
    queryKey: ["tabular-datasets"],
    queryFn: getTabularDatasetsCached,
    enabled: !!areas,
  });

  const { data: submissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ["area-submissions", areas, datasets],
    queryFn: () =>
      areas && datasets
        ? getSubmissionsWithOffline(areas, datasets)
        : Promise.resolve([]),
    enabled: !!areas,
  });

  const provinceName = areas?.provinces?.find((p) => p.id === form.province)?.name ?? "";
  const areaCouncilName =
    form.area_council && areas?.area_councils
      ? areas.area_councils.find((ac) => ac.id === form.area_council)?.name ?? ""
      : "";

  const { data: baselineData, isLoading: baselineLoading } = useQuery({
    queryKey: [
      "baseline-data",
      form.dataset,
      form.province,
      form.area_council,
      provinceName,
      areaCouncilName,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (provinceName) params.set("province", provinceName);
      if (areaCouncilName) params.set("area_council", areaCouncilName);
      const res = await getDatasetData("tabular", form.dataset, params);
      return (res as { results?: TabularData[] }).results ?? [];
    },
    enabled:
      !!form.dataset &&
      !!form.province &&
      !!provinceName &&
      !!areas,
  });

  const baselineRows = useMemo(() => {
    if (!baselineData?.length) return [];
    return buildBaselineRows(baselineData, form.year, form.items);
  }, [baselineData, form.year, form.items]);

  const hasBaseline = baselineRows.length > 0;

  // When baseline loads and form has no attributes yet, populate from baseline
  useEffect(() => {
    if (!hasBaseline) return;
    const hasAttrs = form.items.some((i) => i.attribute.trim());
    if (hasAttrs) return;
    setForm((prev) => ({
      ...prev,
      items: baselineRows.map((r) => ({ attribute: r.attribute, value: r.newValue })),
    }));
  }, [hasBaseline, baselineRows]);

  const updateBaselineValue = (attribute: string, value: number) => {
    setForm((prev) => {
      const idx = prev.items.findIndex((i) => i.attribute === attribute);
      const next = [...prev.items];
      if (idx >= 0) {
        next[idx] = { ...next[idx], value };
      } else {
        next.push({ attribute, value });
      }
      return { ...prev, items: next };
    });
  };

  const existingYears = useMemo(() => {
    const years = new Set<number>();
    for (const r of baselineRows) {
      Object.keys(r.byYear).forEach((y) => years.add(Number(y)));
    }
    return [...years].sort((a, b) => a - b);
  }, [baselineRows]);

  const createMutation = useMutation({
    mutationFn: createAreaSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["area-submissions"] });
      setForm({ dataset: 0, province: 0, area_council: null, year: CURRENT_YEAR, items: [{ attribute: "", value: 0 }] });
      setEditingLocalId(null);
      toast.success("Draft saved");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to save"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateSubmissionPayload> }) =>
      updateAreaSubmission(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["area-submissions"] });
      setEditingId(null);
      toast.success("Draft updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const submitMutation = useMutation({
    mutationFn: submitAreaSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["area-submissions"] });
      toast.success("Submitted for approval");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to submit"),
  });

  const addItemRow = () => {
    setForm((f) => ({ ...f, items: [...f.items, { attribute: "", value: 0 }] }));
  };

  const removeItemRow = (i: number) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, idx) => idx !== i),
    }));
  };

  const updateItem = (i: number, field: "attribute" | "value", val: string | number) => {
    setForm((f) => {
      const next = [...f.items];
      next[i] = { ...next[i], [field]: field === "value" ? Number(val) || 0 : val };
      return { ...f, items: next };
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      items: form.items.filter((i) => i.attribute.trim()),
    };
    if (payload.items.length === 0) {
      toast.error("Add at least one attribute/value");
      return;
    }
    if (!form.dataset || !form.province) {
      toast.error("Select dataset and province");
      return;
    }

    const isOffline = !navigator.onLine;
    const meta = {
      datasetName: datasets.find((d) => d.id === form.dataset)?.name,
      provinceName: provinceOptions.find((p) => p.id === form.province)?.name,
      areaCouncilName: form.area_council
        ? areaCouncilOptions.find((ac) => ac.id === form.area_council)?.name
        : undefined,
    };

    if (isOffline) {
      try {
        if (editingLocalId) {
          await updateOfflineDraft(editingLocalId, payload);
          toast.success("Draft updated locally (offline)");
        } else {
          await saveOfflineDraft(payload, meta);
          incrementQueued();
          toast.success("Draft saved locally", "Will sync when back online.");
          setForm({ dataset: 0, province: 0, area_council: null, year: CURRENT_YEAR, items: [{ attribute: "", value: 0 }] });
        }
        queryClient.invalidateQueries({ queryKey: ["area-submissions"] });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to save locally");
      }
      return;
    }

    if (editingLocalId) {
      try {
        await createAreaSubmission(payload);
        await deleteOfflineDraft(editingLocalId);
        useOfflineStore.getState().decrementQueued();
        queryClient.invalidateQueries({ queryKey: ["area-submissions"] });
        setEditingLocalId(null);
        setForm({ dataset: 0, province: 0, area_council: null, year: CURRENT_YEAR, items: [{ attribute: "", value: 0 }] });
        toast.success("Draft synced to server");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to sync");
      }
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (s: AreaSubmission | LocalDraftDisplay) => {
    if (s.status !== "draft") return;
    if ("isLocal" in s && s.isLocal) {
      setEditingLocalId(s.id as string);
      setEditingId(null);
    } else {
      setEditingId((s as AreaSubmission).id);
      setEditingLocalId(null);
    }
    setForm({
      dataset: s.dataset,
      province: s.province,
      area_council: s.area_council,
      year: s.year,
      items: s.items.length ? s.items : [{ attribute: "", value: 0 }],
    });
  };

  if (areasLoading || areasError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-4">
        {areasError && (
          <p className="text-sm text-destructive">
            You are not an area administrator. Contact your administrator to get access.
          </p>
        )}
        <Button variant="outline" onClick={() => setDataEntryPageOpen(false)}>
          <LuArrowLeft className="size-4 mr-2" />
          Back to MIS
        </Button>
      </div>
    );
  }

  const provinceOptions = areas?.provinces ?? [];
  const areaCouncilOptions = (areas?.area_councils ?? []).filter(
    (ac) => !form.province || ac.province_id === form.province,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Area Data Entry</h1>
          <Button variant="ghost" size="sm" onClick={() => setDataEntryPageOpen(false)}>
            <LuArrowLeft className="size-4 mr-2" />
            Back to MIS
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Enter data for your constituency. Save as draft, then submit for VBoS approval. Approved data appears in the MIS.
        </p>

        <form onSubmit={handleSubmitForm} className="space-y-4 rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium">
            {editingId || editingLocalId ? "Edit draft" : "New submission"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Dataset</Label>
              <Select
                value={String(form.dataset || "")}
                onValueChange={(v) => setForm((f) => ({ ...f, dataset: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select
                value={String(form.year)}
                onValueChange={(v) => setForm((f) => ({ ...f, year: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Province</Label>
              <Select
                value={String(form.province || "")}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, province: Number(v), area_council: null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {provinceOptions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Area Council (optional)</Label>
              <Select
                value={form.area_council ? String(form.area_council) : "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, area_council: v === "none" ? null : Number(v) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Province-level only" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Province-level only</SelectItem>
                  {areaCouncilOptions.map((ac) => (
                    <SelectItem key={ac.id} value={String(ac.id)}>
                      {ac.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Data (attribute / value)</Label>
              {!hasBaseline && (
                <Button type="button" variant="ghost" size="sm" onClick={addItemRow}>
                  <LuPlus className="size-4 mr-1" />
                  Add row
                </Button>
              )}
            </div>

            {baselineLoading && form.dataset && form.province ? (
              <p className="text-sm text-muted-foreground">Loading existing baseline data…</p>
            ) : hasBaseline ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Attribute</th>
                      {existingYears.map((y) => (
                        <th key={y} className="px-3 py-2 text-right font-medium">
                          {y}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium">
                        {form.year} (new)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {baselineRows.map((row) => (
                      <tr key={row.attribute} className="border-b border-border last:border-0">
                        <td className="px-3 py-2 font-medium">{row.attribute}</td>
                        {existingYears.map((y) => (
                          <td key={y} className="px-3 py-2 text-right text-muted-foreground">
                            {row.byYear[y] ?? "—"}
                          </td>
                        ))}
                        <td className="px-3 py-2">
                          <Input
                            type="number"
                            placeholder="Enter value"
                            className="h-8 w-24 text-right"
                            value={form.items.find((i) => i.attribute === row.attribute)?.value ?? ""}
                            onChange={(e) =>
                              updateBaselineValue(
                                row.attribute,
                                Number(e.target.value) || 0,
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2">
                {form.dataset && form.province && !baselineLoading && (
                  <p className="text-sm text-muted-foreground">
                    No existing baseline data for this area. Add attributes manually.
                  </p>
                )}
                {form.items.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Attribute (e.g. population)"
                      value={item.attribute}
                      onChange={(e) => updateItem(i, "attribute", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Value"
                      value={item.value || ""}
                      onChange={(e) => updateItem(i, "value", e.target.value)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItemRow(i)}
                      disabled={form.items.length <= 1}
                    >
                      <LuTrash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingId || editingLocalId ? "Update draft" : "Save draft"}
            </Button>
            {(editingId || editingLocalId) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setEditingLocalId(null);
                  setForm({
                    dataset: 0,
                    province: 0,
                    area_council: null,
                    year: CURRENT_YEAR,
                    items: [{ attribute: "", value: 0 }],
                  });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div>
          <h2 className="mb-3 font-medium">My submissions</h2>
          {submissionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border border-border p-3",
                    s.status === "draft" && "bg-muted/30",
                  )}
                >
                  <div>
                    <p className="font-medium">
                      {s.dataset_name} / {s.province_name}
                      {s.area_council_name ? ` / ${s.area_council_name}` : ""} / {s.year}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.status}
                      {"isLocal" in s && s.isLocal && " · Pending sync"}
                      {" · "}
                      {s.items.length} items
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {s.status === "draft" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => startEdit(s)}>
                          Edit
                        </Button>
                        {"isLocal" in s && s.isLocal ? (
                          <Button
                            size="sm"
                            onClick={async () => {
                              if (!navigator.onLine) {
                                toast.error("Go online to submit for approval");
                                return;
                              }
                              try {
                                const payload: CreateSubmissionPayload = {
                                  dataset: s.dataset,
                                  province: s.province,
                                  area_council: s.area_council ?? undefined,
                                  year: s.year,
                                  items: s.items,
                                };
                                const created = await createAreaSubmission(payload);
                                await deleteOfflineDraft(s.id);
                                useOfflineStore.getState().decrementQueued();
                                await submitAreaSubmission(created.id);
                                queryClient.invalidateQueries({ queryKey: ["area-submissions"] });
                                toast.success("Submitted for approval");
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Failed to submit");
                              }
                            }}
                            disabled={submitMutation.isPending}
                          >
                            <LuSend className="size-4 mr-1" />
                            Submit
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => submitMutation.mutate((s as AreaSubmission).id)}
                            disabled={submitMutation.isPending}
                          >
                            <LuSend className="size-4 mr-1" />
                            Submit
                          </Button>
                        )}
                      </>
                    )}
                    {s.status === "rejected" && s.rejection_reason && (
                      <span className="text-xs text-destructive" title={s.rejection_reason}>
                        Rejected
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
