from django.apps import AppConfig


class AuditConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "vbos.audit"
    label = "audit"
    verbose_name = "Audit Logging"

    def ready(self):
        """Register signal handlers, then enable audit tracking for key models."""
        # Import connects @receiver handlers (must run after app registry is ready).
        from . import signals_handlers  # noqa: F401

        from .signals_handlers import enable_audit_tracking
        from vbos.datasets.models import TabularItem, VectorItem
        from vbos.field_check.models import FieldCheckRecord
        
        # Enable audit tracking for key models
        enable_audit_tracking(TabularItem)
        enable_audit_tracking(VectorItem)
        enable_audit_tracking(FieldCheckRecord)
