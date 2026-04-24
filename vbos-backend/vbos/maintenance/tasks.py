"""Celery tasks for maintenance (scheduled backups)."""
from __future__ import annotations

import logging
import traceback
from pathlib import Path

from celery import shared_task
from django.conf import settings
from django.core.mail import mail_admins
from django.utils import timezone

from vbos.maintenance.backup_restore import create_backup_zip
from vbos.maintenance.constants import BACKUP_CATEGORIES
from vbos.maintenance.models import BackupLog

logger = logging.getLogger(__name__)


def _full_backup_categories() -> list[str]:
    return [c["key"] for c in BACKUP_CATEGORIES]


@shared_task(bind=True, max_retries=3)
def run_scheduled_backup(self) -> dict:
    """
    Full ZIP backup (all categories), stored under MEDIA_ROOT/backups/, logged to BackupLog.
    Emails admins on success; on final failure after retries, emails admins with traceback.
    """
    ts = timezone.now().strftime("%Y-%m-%d_%H%M")
    filename = f"drmis-backup-scheduled-{ts}.zip"
    categories = _full_backup_categories()

    try:
        zip_bytes, _ = create_backup_zip(
            categories=categories,
            compression="medium",
            filename=filename,
        )

        backups_dir = Path(settings.MEDIA_ROOT) / "backups"
        backups_dir.mkdir(parents=True, exist_ok=True)
        rel_path = f"backups/{filename}"
        abs_path = Path(settings.MEDIA_ROOT) / rel_path
        abs_path.write_bytes(zip_bytes)
        size = len(zip_bytes)

        log = BackupLog.objects.create(
            backup_type=BackupLog.BACKUP_TYPE_FULL,
            size_bytes=size,
            filename=filename,
            included_categories=categories,
            created_by=None,
            file_path=rel_path,
        )

        mail_admins(
            subject="[DRMIS] Scheduled backup succeeded",
            message=(
                f"Backup {filename} created ({size} bytes).\n"
                f"BackupLog id={log.pk}\n"
                f"Path (relative to media): {rel_path}"
            ),
        )

        return {
            "ok": True,
            "backup_log_id": log.pk,
            "filename": filename,
            "size_bytes": size,
            "file_path": rel_path,
        }

    except Exception as exc:
        if self.request.retries >= self.max_retries:
            logger.exception("Scheduled backup failed (final)")
            mail_admins(
                subject="[DRMIS] Scheduled backup FAILED (no retries left)",
                message=f"{exc!r}\n\n{traceback.format_exc()}",
            )
            raise

        logger.warning("Scheduled backup failed (retry %s/%s): %s", self.request.retries + 1, self.max_retries, exc)
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
