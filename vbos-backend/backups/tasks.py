"""
Scheduled backup Celery task.

Implementation lives in the ``maintenance`` app (``INSTALLED_APPS``) so Celery
``autodiscover_tasks()`` picks it up. Import from here for compatibility with
paths that reference ``vbos-backend/backups/tasks.py``.
"""

from vbos.maintenance.tasks import run_scheduled_backup

__all__ = ("run_scheduled_backup",)
