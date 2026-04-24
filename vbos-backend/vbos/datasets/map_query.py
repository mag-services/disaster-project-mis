"""
Natural-language map query planner (OpenAI JSON). Builds a safe plan over known catalog.
"""
from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any

from django.conf import settings

from vbos.datasets.models import (
    Cluster,
    DatasetPublicationStatus,
    Province,
    TabularDataset,
    VectorDataset,
    TabularItem,
)

logger = logging.getLogger(__name__)

JSON_SCHEMA_HINT = """
Return a single JSON object with these keys only:
- explanation (string, user-facing summary of what will happen)
- scenario (string): "disaster" or "climate"
- cluster (string or null): exact cluster name from catalog, or null if only disaster overlay vectors
- view_type (string or null): one of baseline, estimated_damage, aid_resources_needed, estimate_financial_damage — null to keep default baseline
- year (string or null): four-digit year for tabular data, or null to leave unchanged
- provinces (array of strings): province names to filter (subset of catalog), may be empty
- area_councils (array of strings): area council names, may be empty
- tabular_dataset_id (integer or null): id from catalog for the main tabular layer, or null
- vector_layer_ids (array of integers): optional vector dataset ids from same cluster
- attribute_icontains (string or null): passed to tabular API attribute filter (substring match)
- value_gte (number or null): minimum tabular row value (e.g. student count)
- value_lte (number or null): maximum tabular row value

Rules:
- Prefer disaster + baseline for facility / school / health queries unless user asks for climate.
- tabular_dataset_id must belong to the chosen cluster when both are set.
- vector_layer_ids must belong to the same cluster when cluster is set.
- If the request cannot be mapped safely, set tabular_dataset_id null, vector_layer_ids [], and explain why in explanation.
"""


def _ai_enabled() -> bool:
    key = getattr(settings, "AI_OPENAI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")
    return bool(key.strip())


def _openai_key() -> str:
    return (getattr(settings, "AI_OPENAI_API_KEY", "") or os.getenv("OPENAI_API_KEY", "")).strip()


def _openai_model() -> str:
    return getattr(settings, "AI_MAP_QUERY_MODEL", None) or os.getenv(
        "AI_MAP_QUERY_MODEL", "gpt-4o-mini"
    )


def build_catalog(request=None) -> dict[str, Any]:
    from vbos.datasets.publication import filter_queryset_for_public_api

    provinces = list(
        Province.objects.order_by("name").values_list("name", flat=True)
    )
    clusters_out: list[dict[str, Any]] = []
    for cluster in Cluster.objects.order_by("order", "name"):
        cname = cluster.name
        tab_qs = TabularDataset.objects.filter(cluster=cluster)
        vec_qs = VectorDataset.objects.filter(cluster=cluster)
        if request is not None:
            tab_qs = filter_queryset_for_public_api(tab_qs, request)
            vec_qs = filter_queryset_for_public_api(vec_qs, request)
        else:
            tab_qs = tab_qs.filter(publication_status=DatasetPublicationStatus.PUBLISHED)
            vec_qs = vec_qs.filter(publication_status=DatasetPublicationStatus.PUBLISHED)
        tabular = list(tab_qs.values("id", "name", "type"))
        vector = list(vec_qs.values("id", "name", "type"))
        tabular_enriched = []
        for t in tabular:
            tid = t["id"]
            attrs = list(
                TabularItem.objects.filter(dataset_id=tid)
                .exclude(attribute__isnull=True)
                .exclude(attribute="")
                .values_list("attribute", flat=True)
                .distinct()[:30]
            )
            tabular_enriched.append({**t, "sample_attributes": attrs})
        clusters_out.append(
            {
                "name": cname,
                "tabular": tabular_enriched,
                "vector": vector,
            }
        )
    return {"provinces": provinces, "clusters": clusters_out}


def _call_openai(system: str, user: str) -> dict[str, Any]:
    payload = {
        "model": _openai_model(),
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2,
    }
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={
            "Authorization": f"Bearer {_openai_key()}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        logger.warning("OpenAI HTTP error: %s %s", e.code, err_body[:500])
        raise RuntimeError(f"OpenAI request failed ({e.code})") from e
    except urllib.error.URLError as e:
        logger.warning("OpenAI URL error: %s", e)
        raise RuntimeError("Could not reach OpenAI API") from e

    try:
        content = raw["choices"][0]["message"]["content"]
        return json.loads(content)
    except (KeyError, IndexError, json.JSONDecodeError) as e:
        logger.warning("Bad OpenAI response shape: %s", raw)
        raise RuntimeError("Invalid response from language model") from e


def _normalize_plan(raw: dict[str, Any]) -> dict[str, Any]:
    return {
        "explanation": str(raw.get("explanation") or "").strip()[:2000],
        "scenario": raw.get("scenario") if raw.get("scenario") in ("disaster", "climate") else "disaster",
        "cluster": raw.get("cluster"),
        "view_type": raw.get("view_type"),
        "year": raw.get("year"),
        "provinces": raw.get("provinces") if isinstance(raw.get("provinces"), list) else [],
        "area_councils": raw.get("area_councils") if isinstance(raw.get("area_councils"), list) else [],
        "tabular_dataset_id": raw.get("tabular_dataset_id"),
        "vector_layer_ids": raw.get("vector_layer_ids") if isinstance(raw.get("vector_layer_ids"), list) else [],
        "attribute_icontains": raw.get("attribute_icontains"),
        "value_gte": raw.get("value_gte"),
        "value_lte": raw.get("value_lte"),
    }


def validate_plan(plan: dict[str, Any], request=None) -> tuple[dict[str, Any], list[str]]:
    """Cross-check ids against DB; fix cluster from tabular if needed."""
    warnings: list[str] = []
    cluster_name = plan.get("cluster")
    if isinstance(cluster_name, str):
        cluster_name = cluster_name.strip() or None
    else:
        cluster_name = None

    tid = plan.get("tabular_dataset_id")
    if tid is not None:
        try:
            tid = int(tid)
        except (TypeError, ValueError):
            warnings.append("Invalid tabular_dataset_id; cleared.")
            tid = None
            plan["tabular_dataset_id"] = None
        if tid is not None:
            from vbos.datasets.publication import filter_queryset_for_public_api

            tqs = TabularDataset.objects.filter(pk=tid)
            if request is not None:
                tqs = filter_queryset_for_public_api(tqs, request)
            else:
                tqs = tqs.filter(publication_status=DatasetPublicationStatus.PUBLISHED)
            tab = tqs.select_related("cluster").first()
            if not tab:
                warnings.append(f"Unknown tabular_dataset_id {tid}; cleared.")
                plan["tabular_dataset_id"] = None
                tid = None
            else:
                t_cluster = tab.cluster.name if tab.cluster else None
                if cluster_name and t_cluster and cluster_name.lower() != t_cluster.lower():
                    warnings.append(
                        f"Cluster mismatch; using tabular cluster {t_cluster!r}."
                    )
                cluster_name = t_cluster
                plan["cluster"] = t_cluster

    vids = []
    for vid in plan.get("vector_layer_ids") or []:
        try:
            vids.append(int(vid))
        except (TypeError, ValueError):
            continue
    plan["vector_layer_ids"] = vids

    if cluster_name and vids:
        from vbos.datasets.publication import filter_queryset_for_public_api

        vqs = VectorDataset.objects.filter(cluster__name__iexact=cluster_name, pk__in=vids)
        if request is not None:
            vqs = filter_queryset_for_public_api(vqs, request)
        else:
            vqs = vqs.filter(publication_status=DatasetPublicationStatus.PUBLISHED)
        valid = set(vqs.values_list("pk", flat=True))
        bad = [i for i in vids if i not in valid]
        if bad:
            warnings.append(f"Removed unknown vector ids for cluster: {bad}.")
        plan["vector_layer_ids"] = [i for i in vids if i in valid]

    provs = []
    valid_provinces = set(
        Province.objects.values_list("name", flat=True)
    )
    for p in plan.get("provinces") or []:
        if not isinstance(p, str):
            continue
        p = p.strip()
        if not p:
            continue
        match = next(
            (vp for vp in valid_provinces if vp.lower() == p.lower()),
            None,
        )
        if match:
            provs.append(match)
        else:
            warnings.append(f"Unknown province ignored: {p!r}.")
    plan["provinces"] = provs

    acs = [str(a).strip() for a in (plan.get("area_councils") or []) if str(a).strip()]
    plan["area_councils"] = acs

    vt = plan.get("view_type")
    allowed_vt = {
        "baseline",
        "estimated_damage",
        "aid_resources_needed",
        "estimate_financial_damage",
    }
    if vt is not None and vt not in allowed_vt:
        warnings.append(f"Ignored invalid view_type {vt!r}.")
        plan["view_type"] = None

    y = plan.get("year")
    if y is not None:
        ys = str(y).strip()
        if len(ys) == 4 and ys.isdigit():
            plan["year"] = ys
        else:
            warnings.append("Invalid year; omitted.")
            plan["year"] = None

    for key in ("value_gte", "value_lte"):
        v = plan.get(key)
        if v is None:
            continue
        try:
            plan[key] = float(v)
        except (TypeError, ValueError):
            warnings.append(f"Ignored invalid {key}.")
            plan[key] = None

    attr = plan.get("attribute_icontains")
    if attr is not None:
        plan["attribute_icontains"] = str(attr).strip()[:200] or None

    plan["cluster"] = cluster_name
    return plan, warnings


def run_map_query(user_text: str, request=None) -> dict[str, Any]:
    if not _ai_enabled():
        raise RuntimeError("AI map query is not configured (missing API key).")

    catalog = build_catalog(request)
    catalog_json = json.dumps(catalog, ensure_ascii=False)
    system = (
        "You are a strict JSON planner for the Vanuatu DRMIS map application.\n"
        f"{JSON_SCHEMA_HINT}\n\n"
        "Catalog (provinces and per-cluster tabular/vector datasets with sample tabular attributes):\n"
        f"{catalog_json}"
    )
    raw = _call_openai(system, f"User request:\n{user_text.strip()[:4000]}")
    plan = _normalize_plan(raw)
    plan, warnings = validate_plan(plan, request=request)
    return {"plan": plan, "warnings": warnings}
