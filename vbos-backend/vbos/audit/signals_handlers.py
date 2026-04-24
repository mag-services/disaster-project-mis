"""
Signal handlers for audit logging system.
Connects Django model signals to capture create, update, and delete actions.
"""
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from .models import AuditLog
from .signals import get_field_changes, log_audit_action


@receiver(pre_save)
def capture_original_state(sender, instance, **kwargs):
    """Capture the original state before save for change detection."""
    if hasattr(instance, '_original_state'):
        return  # Already captured
    
    # Only track auditable models
    if hasattr(instance, '_audit_enabled'):
        try:
            # Get the current instance from database
            if instance.pk:
                original = sender.objects.get(pk=instance.pk)
                instance._original_state = original
        except sender.DoesNotExist:
            pass


@receiver(post_save)
def audit_save(sender, instance, created, **kwargs):
    """Handle post_save signal for audit logging."""
    # Only audit specific models
    if not hasattr(instance, '_audit_enabled'):
        return
    
    try:
        content_type = ContentType.objects.get_for_model(sender)
        
        if created:
            # Log creation
            log_audit_action(
                action=AuditLog.ACTION_CREATE,
                instance=instance,
                request=getattr(kwargs.get('request'), None)
            )
        else:
            # Log field-level changes for updates
            field_changes = get_field_changes(instance, getattr(instance, '_original_state', None))
            if field_changes:
                for field_name, (old_val, new_val) in field_changes.items():
                    log_audit_action(
                        action=AuditLog.ACTION_UPDATE,
                        instance=instance,
                        field_changes={field_name: (old_val, new_val)},
                        request=getattr(kwargs.get('request'), None)
                    )
    except Exception as e:
        # Log errors but don't break the save operation
        print(f"Audit logging error: {e}")


@receiver(post_delete)
def audit_delete(sender, instance, **kwargs):
    """Handle post_delete signal for audit logging."""
    # Only audit specific models
    if not hasattr(instance, '_audit_enabled'):
        return
    
    try:
        log_audit_action(
            action=AuditLog.ACTION_DELETE,
            instance=instance,
            request=getattr(kwargs.get('request'), None)
        )
    except Exception as e:
        print(f"Audit logging error: {e}")


# Enable audit tracking for specific models
def enable_audit_tracking(model_class):
    """Add audit tracking attributes to a model class."""
    model_class._audit_enabled = True
