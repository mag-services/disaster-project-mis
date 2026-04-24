"""Validate DRMIS map workspace JSON payloads (schema v1)."""
from __future__ import annotations

from typing import Any

from rest_framework.exceptions import ValidationError

DRMIS_WORKSPACE_SCHEMA_VERSION = 1
MAX_WORKSPACE_PAYLOAD_BYTES = 512_000  # ~512 KiB


def validate_workspace_payload(data: Any) -> dict[str, Any]:
    """
    Ensure payload is a dict matching DRMIS workspace v1.
    Returns the same dict for storage.
    """
    if not isinstance(data, dict):
        raise ValidationError({"payload": "Must be a JSON object."})

    raw = str(data)
    if len(raw.encode("utf-8")) > MAX_WORKSPACE_PAYLOAD_BYTES:
        raise ValidationError({"payload": "Workspace data is too large."})

    if data.get("app") != "drmis":
        raise ValidationError({"payload": 'Expected app: "drmis".'})
    if data.get("schemaVersion") != DRMIS_WORKSPACE_SCHEMA_VERSION:
        raise ValidationError(
            {"payload": f"Unsupported schemaVersion (need {DRMIS_WORKSPACE_SCHEMA_VERSION})."}
        )

    scenario = data.get("scenarioId")
    if scenario not in (
        "disaster",
        "climate",
        "compare",
        "forecast",
        "risk",
        "planning",
    ):
        raise ValidationError({"payload": "Invalid scenarioId."})

    if not isinstance(data.get("layers"), str):
        raise ValidationError({"payload": "Invalid layers."})

    pw = data.get("primaryWorkspace")
    if pw not in ("command-centre", "operations"):
        raise ValidationError({"payload": "Invalid primaryWorkspace."})

    if not isinstance(data.get("shellNavId"), str):
        raise ValidationError({"payload": "Invalid shellNavId."})

    if not isinstance(data.get("cluster"), str):
        raise ValidationError({"payload": "Invalid cluster."})

    st = data.get("selectedViewType")
    if st is not None and st not in (
        "baseline",
        "estimated_damage",
        "aid_resources_needed",
        "estimate_financial_damage",
    ):
        raise ValidationError({"payload": "Invalid selectedViewType."})

    if not isinstance(data.get("selectedClimateModule"), str):
        raise ValidationError({"payload": "Invalid selectedClimateModule."})

    if not isinstance(data.get("year"), str):
        raise ValidationError({"payload": "Invalid year."})

    provinces = data.get("provinces")
    if not isinstance(provinces, list) or not all(isinstance(p, str) for p in provinces):
        raise ValidationError({"payload": "Invalid provinces."})

    ac_list = data.get("acList")
    if not isinstance(ac_list, list) or not all(isinstance(p, str) for p in ac_list):
        raise ValidationError({"payload": "Invalid acList."})

    m = data.get("map")
    if not isinstance(m, dict):
        raise ValidationError({"payload": "Invalid map."})
    for key, typ in (
        ("latitude", (int, float)),
        ("longitude", (int, float)),
        ("zoom", (int, float)),
        ("mapStyle", str),
    ):
        if key not in m or not isinstance(m[key], typ):
            raise ValidationError({"payload": f"Invalid map.{key}."})
    if m.get("mapMode") not in ("2d", "3d"):
        raise ValidationError({"payload": "Invalid map.mapMode."})

    c = data.get("compare")
    if not isinstance(c, dict):
        raise ValidationError({"payload": "Invalid compare."})
    if not isinstance(c.get("enabled"), bool):
        raise ValidationError({"payload": "Invalid compare.enabled."})
    if c.get("view") not in ("swipe", "delta"):
        raise ValidationError({"payload": "Invalid compare.view."})
    for key in ("yearLeft", "yearRight"):
        if not isinstance(c.get(key), str):
            raise ValidationError({"payload": f"Invalid compare.{key}."})

    taf = data.get("tabularAttributeFilter")
    if taf is not None and not isinstance(taf, str):
        raise ValidationError({"payload": "Invalid tabularAttributeFilter."})

    tap = data.get("tabularApiParams")
    if tap is not None:
        if not isinstance(tap, dict):
            raise ValidationError({"payload": "Invalid tabularApiParams."})

    return data
