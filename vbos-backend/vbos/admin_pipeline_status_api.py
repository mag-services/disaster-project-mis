from __future__ import annotations

from django.contrib.auth import get_user_model
from django_otp import user_has_device
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from vbos.area_submissions.models import AreaDataSubmission
from vbos.celery import app as celery_app
from vbos.maintenance.models import BackupLog
from vbos.rap_import.models import RAPImportBatch

User = get_user_model()


def _celery_online() -> bool:
    """
    Best-effort celery worker health.
    """

    try:
        insp = celery_app.control.inspect()
        if not insp:
            return False
        ping = insp.ping() or {}
        return isinstance(ping, dict) and any(bool(v) for v in ping.values())
    except Exception:
        return False


def _mfa_missing_count() -> int:
    """
    Count active users that have no enrolled OTP device.
    """

    missing = 0
    for u in User.objects.filter(is_active=True).only("id"):
        if not user_has_device(u):
            missing += 1
    return missing


def compute_admin_pipeline_status_internal() -> dict[str, object]:
    """
    Best-effort operator pipeline snapshot.

    This is used by both:
    - `GET /api/v1/admin/pipeline-status/`
    - the Unfold backend admin dashboard callback
    """

    data: dict[str, object] = {}

    try:
        data["rap_pending"] = RAPImportBatch.objects.filter(status="pending").count()
    except Exception:
        data["rap_pending"] = None

    try:
        data["approvals_pending"] = AreaDataSubmission.objects.filter(
            status=AreaDataSubmission.STATUS_SUBMITTED
        ).count()
    except Exception:
        data["approvals_pending"] = None

    try:
        data["mfa_missing"] = _mfa_missing_count()
    except Exception:
        data["mfa_missing"] = None

    # Last backup
    try:
        last = BackupLog.objects.order_by("-created_at").first()
        if last and getattr(last, "created_at", None):
            created_at = last.created_at
            age_hours = (timezone.now() - created_at).total_seconds() / 3600.0
            data["last_backup_created_at"] = created_at
            data["last_backup_age_hours"] = round(age_hours, 1)
            data["last_backup_stale"] = age_hours > 24
            data["last_backup_status"] = "success"
        else:
            data["last_backup_created_at"] = None
            data["last_backup_age_hours"] = None
            data["last_backup_stale"] = True
            data["last_backup_status"] = "missing"
    except Exception:
        data["last_backup_created_at"] = None
        data["last_backup_age_hours"] = None
        # Unknown state — fail closed so operators see red until backup health is confirmed
        data["last_backup_stale"] = True
        data["last_backup_status"] = None

    try:
        data["celery_online"] = _celery_online()
    except Exception:
        data["celery_online"] = None

    # Recent audit
    try:
        from core.models import AuditLog  # type: ignore

        audit_logging_active = True
        recent_raw = AuditLog.objects.order_by("-timestamp")[:5]
        data["recent_audit"] = [
            {
                "timestamp": getattr(a, "timestamp", None),
                "user": getattr(getattr(a, "user", None), "username", None),
                "action": getattr(a, "action", None),
                "model": getattr(a, "model_name", None) or getattr(a, "model", None),
                "object": getattr(a, "object_repr", None) or getattr(a, "object", None),
            }
            for a in recent_raw
        ]
    except Exception:
        audit_logging_active = False
        data["recent_audit"] = []

    data["audit_logging_active"] = audit_logging_active

    return data


class AdminPipelineStatusView(APIView):
    """
    Staff-only health snapshot for operator pipelines.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        internal = compute_admin_pipeline_status_internal()
        return Response(
            {
                "rap_pending": internal.get("rap_pending"),
                "approvals_pending": internal.get("approvals_pending"),
                "mfa_missing": internal.get("mfa_missing"),
                "last_backup_age_hours": internal.get("last_backup_age_hours"),
                "last_backup_status": internal.get("last_backup_status"),
                "last_backup_stale": internal.get("last_backup_stale"),
                "celery_online": internal.get("celery_online"),
                "recent_audit": internal.get("recent_audit", []),
            }
        )

