"""
Signals and mixins for audit logging field-level changes.
Captures create, update, and delete actions on tracked models.
"""
import json
from django.contrib.contenttypes.models import ContentType
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import AuditLog


def get_field_changes(instance, old_instance=None):
    """
    Compare old and new instances to detect field-level changes.
    Returns dict of field_name: (old_value, new_value) pairs.
    """
    if not old_instance:
        return {}  # No previous instance for comparison
    
    changes = {}
    for field in instance._meta.fields:
        field_name = field.name
        if field_name in ['id', 'created', 'updated', 'timestamp']:
            continue  # Skip auto-managed fields
            
        old_value = getattr(old_instance, field_name, None)
        new_value = getattr(instance, field_name, None)
        
        # Handle different field types appropriately
        if old_value != new_value:
            # Convert to string for storage
            old_str = str(old_value) if old_value is not None else None
            new_str = str(new_value) if new_value is not None else None
            
            # Handle JSON fields specially
            if field_name in ['metadata', 'climate_modules', 'intensity_data']:
                old_str = json.dumps(old_value) if old_value is not None else None
                new_str = json.dumps(new_value) if new_value is not None else None
            
            changes[field_name] = (old_str, new_str)
    
    return changes


def _acting_organisation_id(user):
    if user is None or not getattr(user, "is_authenticated", False):
        return None
    return getattr(user, "organisation_id", None)


def log_audit_action(action, instance, user=None, field_changes=None, request=None):
    """
    Create an AuditLog entry for the given action.
    """
    # Get content type for the instance
    content_type = ContentType.objects.get_for_model(instance.__class__)
    
    # Get user from request or instance
    if not user and hasattr(instance, 'user'):
        user = getattr(instance, 'user', None)
    elif not user and request:
        user = getattr(request, 'user', None)

    acting_org_id = _acting_organisation_id(user)
    
    # Extract request metadata
    ip_address = getattr(request, 'ip_address', None) if request else None
    user_agent = getattr(request, 'user_agent', None) if request else None
    
    # Handle different action types
    if action == AuditLog.ACTION_DELETE:
        AuditLog.objects.create(
            content_type=content_type,
            object_id=instance.pk,
            action=action,
            user=user,
            acting_organisation_id=acting_org_id,
            ip_address=ip_address,
            user_agent=user_agent,
            object_repr=str(instance)[:200],
        )
    elif action == AuditLog.ACTION_CREATE:
        AuditLog.objects.create(
            content_type=content_type,
            object_id=instance.pk,
            action=action,
            user=user,
            acting_organisation_id=acting_org_id,
            ip_address=ip_address,
            user_agent=user_agent,
            object_repr=str(instance)[:200],
        )
    elif action == AuditLog.ACTION_UPDATE and field_changes:
        # Create individual audit logs for each field change
        for field_name, (old_value, new_value) in field_changes.items():
            AuditLog.objects.create(
                content_type=content_type,
                object_id=instance.pk,
                action=action,
                user=user,
                acting_organisation_id=acting_org_id,
                field_name=field_name,
                old_value=old_value,
                new_value=new_value,
                ip_address=ip_address,
                user_agent=user_agent,
                object_repr=str(instance)[:200],
            )


class AuditableMixin:
    """
    Mixin to add audit logging capabilities to models.
    Models should inherit from this mixin to enable automatic audit logging.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_state = None
    
    def __setattr__(self, name, value):
        """Track field assignments for audit logging."""
        super().__setattr__(name, value)
    
    def get_audit_user(self):
        """Get the user responsible for this change."""
        # Try to get user from various sources
        if hasattr(self, '_current_user'):
            return getattr(self, '_current_user')
        elif hasattr(self, 'user'):
            return getattr(self, 'user')
        return None
    
    def set_audit_user(self, user):
        """Set the user responsible for subsequent changes."""
        self._current_user = user


class AuditLogMiddleware:
    """
    Middleware to capture request metadata for audit logging.
    Extracts IP address and user agent from requests.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Store request metadata for access by audit signals
        request.ip_address = self.get_client_ip(request)
        request.user_agent = request.META.get('HTTP_USER_AGENT', '')
        response = self.get_response(request)
        return response
    
    def get_client_ip(self, request):
        """Extract client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        
        x_real_ip = request.META.get('HTTP_X_REAL_IP')
        if x_real_ip:
            return x_real_ip
        
        return request.META.get('REMOTE_ADDR')
