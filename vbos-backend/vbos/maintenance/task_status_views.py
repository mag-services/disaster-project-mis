"""Celery async task status API."""

from __future__ import annotations

from typing import Any

from celery.result import AsyncResult
from drf_spectacular.utils import extend_schema
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (dict, list, str, int, float, bool)):
        return value
    return str(value)


def _progress_for_state(state: str, info: Any) -> int:
    if state == "SUCCESS":
        return 100
    if state == "FAILURE":
        return 0
    if isinstance(info, dict) and "progress" in info:
        try:
            p = float(info["progress"])
            return max(0, min(100, int(p)))
        except (TypeError, ValueError):
            return 0
    return 0


@extend_schema(
    summary="Celery task status",
    description="Poll status of an async Celery task by id (django-celery-results).",
    responses={
        200: {
            "type": "object",
            "properties": {
                "task_id": {"type": "string"},
                "status": {
                    "type": "string",
                    "enum": ["PENDING", "STARTED", "SUCCESS", "FAILURE", "RETRY", "REVOKED"],
                },
                "result": {},
                "progress": {"type": "integer", "minimum": 0, "maximum": 100},
            },
        }
    },
)
@api_view(["GET"])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def celery_task_status(request: Request, task_id: str) -> Response:
    """GET /api/v1/tasks/<task_id>/status/ — requires authenticated user (session or token)."""
    async_result = AsyncResult(task_id)
    state = async_result.state
    info = async_result.info

    payload = {
        "task_id": task_id,
        "status": state,
        "result": None,
        "progress": _progress_for_state(state, info),
    }

    if state == "SUCCESS":
        payload["result"] = _json_safe(async_result.result)
        payload["progress"] = 100
    elif state == "FAILURE":
        err = async_result.result
        payload["result"] = str(err) if err is not None else None
    elif state in ("STARTED", "RETRY") and isinstance(info, dict):
        payload["result"] = _json_safe(info)
    elif isinstance(info, dict):
        payload["result"] = _json_safe(info)

    return Response(payload)
