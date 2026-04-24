"""
Normalize API error JSON:
- Validation failures → { "errors": { "<field>": ["..."] } }
- Other client/server errors → { "detail": "<message>" } (DRF default)
"""

from __future__ import annotations

from rest_framework.exceptions import ErrorDetail, ValidationError
from rest_framework.views import exception_handler as drf_exception_handler


def vbos_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    data = response.data

    if isinstance(exc, ValidationError):
        response.data = _wrap_validation_errors(data)
        return response

    # Ensure non-validation errors use a single `detail` when possible
    if isinstance(data, dict) and "detail" not in data and "errors" not in data:
        # Rare: multi-key dict from custom exceptions
        if len(data) == 1:
            key, val = next(iter(data.items()))
            if isinstance(val, (list, tuple)) and val:
                first = val[0]
                if isinstance(first, ErrorDetail):
                    first = str(first)
                response.data = {"detail": f"{key}: {first}"}
            else:
                response.data = {"detail": str(val)}
        else:
            response.data = {"detail": str(data)}

    return response


def _wrap_validation_errors(data):
    if isinstance(data, dict):
        if "detail" in data and len(data) == 1:
            # Non-field validation sometimes only has detail
            return {"errors": {"non_field_errors": _as_list(data["detail"])}}
        return {"errors": data}
    if isinstance(data, list):
        return {"errors": {"non_field_errors": [str(x) for x in data]}}
    return {"errors": {"non_field_errors": [str(data)]}}


def _as_list(v):
    if v is None:
        return []
    if isinstance(v, (list, tuple)):
        return [str(x) for x in v]
    return [str(v)]
