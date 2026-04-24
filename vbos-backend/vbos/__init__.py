# Import Celery only when installed (rebuild image after adding celery to requirements.txt).
try:
    from .celery import app as celery_app
except ImportError:
    celery_app = None  # type: ignore[assignment, misc]

__all__ = ("celery_app",)
