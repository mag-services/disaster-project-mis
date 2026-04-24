"""
API discovery and health — version/build aligned with frontend `DRMIS_VERSION_DISPLAY`.
"""

from __future__ import annotations

from django.conf import settings
from django.db import connection
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


def _version_payload() -> dict:
    return {
        "version": getattr(settings, "DRMIS_API_VERSION", "1.0.0"),
        "build": getattr(settings, "DRMIS_BUILD_ID", ""),
        "display": getattr(settings, "DRMIS_VERSION_DISPLAY", ""),
    }


@extend_schema(
    summary="API metadata",
    description="Version, build identifier, and links to documentation and health checks.",
    tags=["metadata"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def api_v1_meta(request):
    """
    Product metadata for `/api/v1/` consumers (mirrors frontend about/version).
    """
    base = request.build_absolute_uri("/").rstrip("/")
    return Response(
        {
            "service": "DRMIS API",
            "api": "v1",
            **_version_payload(),
            "documentation": {
                "swagger_ui": f"{base}/api/v1/docs/",
                "openapi_schema": f"{base}/api/v1/schema/",
            },
            "health": f"{base}/api/v1/health/",
        }
    )


def _check_database() -> tuple[bool, str | None]:
    try:
        with connection.cursor() as c:
            c.execute("SELECT 1")
        return True, None
    except Exception as e:
        return False, str(e)


def _check_redis() -> tuple[bool, str | None]:
    try:
        import redis

        url = getattr(settings, "CELERY_BROKER_URL", None) or "redis://localhost:6379/0"
        r = redis.Redis.from_url(url, socket_connect_timeout=1, socket_timeout=1)
        if r.ping():
            return True, None
        return False, "ping failed"
    except Exception as e:
        return False, str(e)


def _check_celery() -> tuple[bool, str | None]:
    try:
        from vbos.celery import app as celery_app

        insp = celery_app.control.inspect()
        if not insp:
            return False, "no broker response"
        ping = insp.ping() or {}
        ok = isinstance(ping, dict) and any(bool(v) for v in ping.values())
        return (True, None) if ok else (False, "no workers")
    except Exception as e:
        return False, str(e)


@extend_schema(
    summary="Health check",
    description=(
        "Database must be reachable for HTTP 200. Redis and Celery status are reported "
        "in the payload; if they fail, `status` is `degraded` but the response stays 200 "
        "so load balancers can keep routing when async workers are optional."
    ),
    tags=["metadata"],
)
@api_view(["GET"])
@permission_classes([AllowAny])
def api_health(request):
    """
    Liveness + dependency checks for operators and load balancers.
    GET /health/ and GET /api/v1/health/
    """
    db_ok, db_err = _check_database()
    redis_ok, redis_err = _check_redis()
    celery_ok, celery_err = _check_celery()

    # 200 if the app + DB are usable (keeps Docker / LB probes passing when Redis is optional in dev).
    # 503 only when the database is down.
    if not db_ok:
        body = {
            "status": "unavailable",
            "timestamp": timezone.now().isoformat(),
            **_version_payload(),
            "checks": {
                "database": {"ok": db_ok, "error": db_err},
                "redis": {"ok": redis_ok, "error": redis_err},
                "celery_workers": {"ok": celery_ok, "error": celery_err},
            },
        }
        return Response(body, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    sub_ok = redis_ok and celery_ok
    body = {
        "status": "ok" if sub_ok else "degraded",
        "timestamp": timezone.now().isoformat(),
        **_version_payload(),
        "checks": {
            "database": {"ok": True, "error": None},
            "redis": {"ok": redis_ok, "error": redis_err},
            "celery_workers": {"ok": celery_ok, "error": celery_err},
        },
    }
    return Response(body, status=status.HTTP_200_OK)
