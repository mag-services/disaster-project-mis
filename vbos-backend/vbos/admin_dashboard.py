"""
Backend admin dashboard callback: operator pipeline status (no incident feed).
"""

from __future__ import annotations

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.urls import reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _

from vbos.area_submissions.models import AreaDataSubmission
from vbos.rap_import.models import RAPImportBatch
from vbos.admin_pipeline_status_api import compute_admin_pipeline_status_internal

User = get_user_model()


INTENSITY_BADGE_STYLES = {
    2: ("#185FA5", "#E6F1FB", "#85B7EB"),
    3: ("#633806", "#FDF3E0", "#F5C875"),
    4: ("#A32D2D", "#FEECEA", "#F7C1C1"),
    5: ("#791F1F", "#FEECEA", "#F7C1C1"),
}

RAP_STATUS_STYLES = {
    "pending": ("#FDF3E0", "#633806", "#F5C875"),
    "importing": ("#EBF3FE", "#0C447C", "#B5D4F4"),
    "complete": ("#EAF6EE", "#27500A", "#9FE1CB"),
    "failed": ("#FEECEA", "#A32D2D", "#F7C1C1"),
}

OK_BADGE = ("#EAF6EE", "#27500A", "#9FE1CB")
WARN_BADGE = ("#FDF3E0", "#633806", "#F5C875")
BAD_BADGE = ("#FEECEA", "#A32D2D", "#F7C1C1")


def _format_age_label(dt) -> tuple[str, bool]:
    if dt is None:
        # No backup record yet — neutral (amber prompt), not red critical
        return "—", False
    delta = timezone.now() - dt
    seconds = max(0, delta.total_seconds())
    stale = seconds > 24 * 3600
    if seconds < 24 * 3600:
        hours = int(seconds // 3600)
        # Ensure we don't show "0h ago" for something that's a few minutes old.
        hours = max(1, hours)
        return f"{hours}h ago", stale
    days = int(seconds // (24 * 3600))
    days = max(1, days)
    return f"{days}d ago", stale


def _badge_html(text: str, bg: str, color: str, border: str, font_size: int = 10):
    return format_html(
        '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:{}px;'
        'padding:2px 8px;border-radius:4px;background:{};color:{};border:1px solid {};">{}</span>',
        font_size,
        bg,
        color,
        border,
        text,
    )


def _rap_intensity_badge(max_intensity: int | None):
    if max_intensity is None:
        return _badge_html("—", "#F8F9FB", "#4A5568", "#E2E6EE")
    c = INTENSITY_BADGE_STYLES.get(int(max_intensity), ("#4A5568", "#F8F9FB", "#E2E6EE"))
    color, bg, border = c
    return _badge_html(f"Cat {int(max_intensity)}", bg, color, border)


def _rap_status_badge(status: str):
    bg, color, border = RAP_STATUS_STYLES.get(status, ("#F8F9FB", "#4A5568", "#E2E6EE"))
    return _badge_html(status.upper(), bg, color, border)


def _celery_online() -> bool:
    try:
        from vbos.celery import app as celery_app

        insp = celery_app.control.inspect()
        if not insp:
            return False
        ping = insp.ping() or {}
        return isinstance(ping, dict) and any(bool(v) for v in ping.values())
    except Exception:
        return False


def _redis_connected() -> bool:
    try:
        import redis

        r = redis.Redis.from_url(
            getattr(settings, "CELERY_BROKER_URL", None) or "redis://localhost:6379/0",
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        return bool(r.ping())
    except Exception:
        return False


def _recent_admin_log_entries(limit: int = 6) -> list[dict[str, object]]:
    """
    Built-in Django admin action log (LogEntry) — available even when custom AuditLog is not wired.
    """

    try:
        from django.contrib.admin.models import LogEntry

        rows: list[dict[str, object]] = []
        for e in (
            LogEntry.objects.select_related("user", "content_type")
            .order_by("-action_time")[:limit]
        ):
            rows.append(
                {
                    "when": e.action_time,
                    "user": e.user.get_username() if e.user_id else "—",
                    "action": e.get_action_flag_display(),
                    "model": (
                        f"{e.content_type.app_label}.{e.content_type.model}"
                        if e.content_type_id
                        else "—"
                    ),
                    "summary": (e.object_repr or "")[:120],
                }
            )
        return rows
    except Exception:
        return []


def _user_missing_mfa_count() -> int:
    try:
        from django_otp import user_has_device

        missing = 0
        for u in User.objects.filter(is_active=True).only("id"):
            if not user_has_device(u):
                missing += 1
        return missing
    except Exception:
        return 0


def dashboard_callback(request, context):
    """
    Inject operator pipeline status into the backend admin dashboard.
    """
    # UI mode banner (visual only, from query string)
    mode = (request.GET.get("mode") or "disaster").lower()
    if mode not in ("disaster", "climate", "compare"):
        mode = "disaster"
    context["admin_mode"] = mode

    # KPI cards
    internal = compute_admin_pipeline_status_internal()

    rap_pending_count = internal.get("rap_pending") or 0
    approvals_pending_count = internal.get("approvals_pending") or 0
    mfa_missing_count = internal.get("mfa_missing") or 0

    last_backup_created_at = internal.get("last_backup_created_at")
    last_backup_age_label, fmt_stale = _format_age_label(last_backup_created_at)
    # Merge: missing backup, >24h, or pipeline API flag — any is an alert state
    last_backup_stale = bool(fmt_stale) or bool(internal.get("last_backup_stale"))

    context["kpi_rap_pending"] = rap_pending_count
    context["kpi_approvals_pending"] = approvals_pending_count
    context["kpi_mfa_missing"] = mfa_missing_count
    context["kpi_last_backup_age_label"] = last_backup_age_label
    context["kpi_last_backup_stale"] = last_backup_stale
    context["last_backup_created_at"] = last_backup_created_at

    # RAP queue + pending approvals
    recent_rap_batches = list(
        RAPImportBatch.objects.annotate(file_count=Count("files"))
        .order_by("-imported_at")[:5]
    )
    context["rap_batches_recent"] = [
        {
            "batch_ref": b.batch_ref,
            "cyclone_name": b.cyclone_name,
            "max_intensity_badge": _rap_intensity_badge(b.max_intensity),
            "status_badge": _rap_status_badge(b.status),
            "file_count": getattr(b, "file_count", 0) or 0,
        }
        for b in recent_rap_batches
    ]

    recent_approvals = list(
        AreaDataSubmission.objects.filter(status=AreaDataSubmission.STATUS_SUBMITTED)
        .select_related("dataset")
        .order_by("-updated")[:5]
    )
    context["approvals_recent"] = [
        {
            "dataset_name": s.dataset.name,
            "type": s.dataset.type,
            "ministry": s.dataset.source or "—",
            "submitted_at": s.submitted_at,
        }
        for s in recent_approvals
    ]

    # System status
    celery_online = bool(internal.get("celery_online"))
    redis_connected = _redis_connected()
    context["system_status"] = {
        "celery_online": celery_online,
        "redis_connected": redis_connected,
        "last_backup_created_at": last_backup_created_at,
        "last_backup_age_label": last_backup_age_label,
        "last_backup_stale": last_backup_stale,
        "last_backup_status": internal.get("last_backup_status"),
    }

    context["audit_logging_active"] = bool(internal.get("audit_logging_active"))
    context["recent_audit"] = internal.get("recent_audit") or []

    # Built-in admin log + URLs for audit placeholder / quick navigation
    context["recent_admin_actions"] = _recent_admin_log_entries()
    try:
        context["admin_logentry_changelist_url"] = reverse("admin:admin_logentry_changelist")
    except Exception:
        context["admin_logentry_changelist_url"] = "/admin/admin/logentry/"

    context["dashboard_quick_links"] = [
        {"title": str(_("Upload RAP CSVs")), "url": "/admin/rap-import/upload/"},
        {"title": str(_("Review pending approvals")), "url": "/admin/area_submissions/areadatasubmission/?status=submitted"},
        {"title": str(_("Backup & Restore")), "url": "/admin/maintenance/"},
        {"title": str(_("Users & roles")), "url": "/admin/users/user/"},
    ]

    return context
