"""
RAP CSV validation and (future) import into TabularDataset / TabularItem.

Column schemas align with disaster-project-rap CSV exports; see project docs.
"""

from __future__ import annotations

import csv
import io
from collections import Counter
from typing import Any, BinaryIO, Optional

from vbos.rap_import.models import RAPImportBatch

# RAP CSV column schemas — derived from the RAP README
# Each sector family has a set of expected columns.
# "required" = must be present for import to proceed
# "optional" = may be absent depending on RAP sub-table
RAP_SCHEMAS: dict[str, dict[str, Any]] = {
    "hazard": {
        "required": ["National", "Province", "Area Council", "Hazard", "Intensity"],
        "optional": [],
        "intensity_col": "Intensity",
        "council_col": "Area Council",
        "province_col": "Province",
    },
    "education": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
            "Resources_Required",
            "Unit_Cost",
        ],
    },
    "energy": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
        ],
    },
    "food_security": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
            "Resources_Required",
        ],
    },
    "gender_protection": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": ["Attribute", "Year", "Resources_Required"],
    },
    "health": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
        ],
    },
    "logistics": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
            "Resources_Required",
        ],
    },
    "shelter": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
        ],
    },
    "telecom": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
        ],
    },
    "wash": {
        "required": ["Province", "Area Council", "Sector", "Indicator", "Value"],
        "optional": [
            "Attribute",
            "Year",
            "Intensity",
            "Damage_Estimate",
            "Financial_Damage",
        ],
    },
    "qc": {
        "required": ["Province", "Area Council"],
        "optional": ["Sector", "Indicator", "Value", "QC_Flag", "Note"],
    },
}

# Map RAP filename prefixes → sector_family (match longest prefix first in detect_sector_family)
RAP_FILENAME_MAP: dict[str, str] = {
    "ex_hazard": "hazard",
    "education": "education",
    "energy": "energy",
    "foodsecurity": "food_security",
    "food_security": "food_security",
    "genderprotection": "gender_protection",
    "gender_protection": "gender_protection",
    "health": "health",
    "logistics": "logistics",
    "shelter": "shelter",
    "telecom": "telecom",
    "wash": "wash",
    "qc_": "qc",
    "qc": "qc",
}


def detect_sector_family(filename: str) -> Optional[str]:
    """
    Infer sector_family from RAP output filename.
    RAP names files like: Education_baseline.csv, FoodSecurity_damage.csv,
    Ex_hazard_areas_MIS_import.csv
    Returns sector_family string or None if unrecognised.
    """
    base = filename.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    name = base.lower().replace("-", "_")
    # Longest prefix wins (e.g. ex_hazard before ex_)
    for prefix in sorted(RAP_FILENAME_MAP.keys(), key=len, reverse=True):
        if name.startswith(prefix):
            return RAP_FILENAME_MAP[prefix]
    return None


def _empty_validation_result(
    *,
    valid: bool,
    errors: list[str],
    row_count: int = 0,
    columns_detected: Optional[list[str]] = None,
) -> dict[str, Any]:
    return {
        "valid": valid,
        "row_count": row_count,
        "columns_detected": columns_detected or [],
        "missing_required": [],
        "warnings": [],
        "errors": errors,
        "intensity_range": None,
        "provinces": [],
        "councils": [],
    }


def validate_rap_csv(file_obj: BinaryIO, sector_family: str) -> dict[str, Any]:
    """
    Validate a RAP CSV file against the expected schema for its sector.
    Returns:
      {
        'valid': bool,
        'row_count': int,
        'columns_detected': list,
        'missing_required': list,
        'warnings': list,  # missing optional cols, blank values, etc.
        'errors': list,    # blocking issues
        'intensity_range': (min, max) or None,  # for hazard files
        'provinces': list,
        'councils': list,
      }
    """
    schema = RAP_SCHEMAS.get(sector_family, {})
    required: list[str] = list(schema.get("required", []))

    try:
        raw = file_obj.read()
        if isinstance(raw, str):
            content = raw
        else:
            content = raw.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(content))
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
        columns = fieldnames
    except Exception as e:
        return _empty_validation_result(valid=False, errors=[f"Cannot parse CSV: {e}"])

    missing_required = [c for c in required if c not in columns]
    errors: list[str] = []
    warnings: list[str] = []

    if missing_required:
        errors.append(f"Missing required columns: {', '.join(missing_required)}")

    # Check for blank Province or Area Council values (when columns exist)
    if "Area Council" in columns:
        blank_council = sum(1 for r in rows if not (r.get("Area Council") or "").strip())
        if blank_council:
            warnings.append(f"{blank_council} rows have blank 'Area Council'")
    if "Province" in columns:
        blank_prov = sum(1 for r in rows if not (r.get("Province") or "").strip())
        if blank_prov:
            warnings.append(f"{blank_prov} rows have blank 'Province'")

    intensity_range: Optional[tuple[int, int]] = None
    if sector_family == "hazard" and "Intensity" in columns:
        try:
            intensities: list[int] = []
            for r in rows:
                cell = (r.get("Intensity") or "").strip()
                if not cell:
                    continue
                intensities.append(int(cell))
            bad = [i for i in intensities if i not in range(0, 6)]
            if bad:
                errors.append(f"Invalid Intensity values (must be 0–5): {sorted(set(bad))}")
            if intensities:
                intensity_range = (min(intensities), max(intensities))
        except ValueError:
            errors.append("Intensity column contains non-numeric values")

    if sector_family == "hazard" and "Area Council" in columns:
        councils_seen = [(r.get("Area Council") or "").strip() for r in rows]
        cnt = Counter(councils_seen)
        dupes = sorted({c for c, n in cnt.items() if n > 1 and c})
        if dupes:
            warnings.append(
                f"Duplicate Area Council rows: {', '.join(dupes[:5])}"
                + (" …" if len(dupes) > 5 else "")
            )

    provinces = sorted(
        {((r.get("Province") or "").strip()) for r in rows if (r.get("Province") or "").strip()}
    )
    councils = sorted(
        {
            ((r.get("Area Council") or "").strip())
            for r in rows
            if (r.get("Area Council") or "").strip()
        }
    )

    optional = schema.get("optional", [])
    missing_optional = [c for c in optional if c not in columns]
    if missing_optional:
        warnings.append(f"Optional columns not present: {', '.join(missing_optional)}")

    return {
        "valid": len(errors) == 0,
        "row_count": len(rows),
        "columns_detected": columns,
        "missing_required": missing_required,
        "warnings": warnings,
        "errors": errors,
        "intensity_range": intensity_range,
        "provinces": provinces,
        "councils": councils,
    }


def normalize_place_name(name: str) -> str:
    """
    Strip and title-case for matching RAP Province / Area Council strings to DRMIS
    ``Province`` / ``AreaCouncil`` names (minor spelling variants).
    """
    if not name or not str(name).strip():
        return ""
    return str(name).strip().title()


def import_rap_batch_to_tabular(
    batch: RAPImportBatch,
    rap_file_obj: BinaryIO,
    *,
    sector_family: str,
) -> tuple[int, int, list[str]]:
    """
    Parse a validated RAP CSV and write rows into TabularDataset / TabularItem.

    TabularItem fields today: dataset, date, attribute, value, province, area_council,
    metadata (JSON). TabularDataset is keyed by (name, type, cluster) — importing
    requires a defined mapping from RAP sector → Cluster + dataset name + type.

    Hazard intensity for Area Councils may also update cyclone/vector layers; that
    belongs in a dedicated hazard import path.

    Returns (rows_created, rows_updated, errors).

    Not implemented yet — call :func:`validate_rap_csv` before invoking; wire
    Cluster/TabularDataset selection and Province/AreaCouncil resolution by name,
    then store Sector/Indicator/Year and related RAP columns in ``metadata``.
    """
    raise NotImplementedError(
        f"import_rap_batch_to_tabular is not yet implemented (batch={batch.batch_ref!r}, "
        f"sector_family={sector_family!r}). "
        "Define TabularDataset targets per sector_family and map RAP columns to "
        "TabularItem (province/area_council FKs, attribute, value, metadata)."
    )
