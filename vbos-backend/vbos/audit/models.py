"""
Audit logging system for tracking dataset changes with field-level diffs.
Captures all modifications to TabularItem, VectorItem, FieldCheckRecord, and Dataset models.
"""
import json
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _


class AuditLog(models.Model):
    """
    Comprehensive audit log tracking field-level changes to datasets.
    Stores before/after values for complete change tracking.
    """
    ACTION_CREATE = "create"
    ACTION_UPDATE = "update"
    ACTION_DELETE = "delete"
    
    ACTION_CHOICES = [
        (ACTION_CREATE, _("Created")),
        (ACTION_UPDATE, _("Updated")),
        (ACTION_DELETE, _("Deleted")),
    ]

    # Model being tracked
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={
            "model__in": ["tabularitem", "vectoritem", "fieldcheckrecord", "rasterdataset", "vectordataset", "tabulardataset", "pmtilesdataset"]
        },
        help_text="The model class being tracked."
    )
    object_id = models.PositiveIntegerField(help_text="Primary key of the tracked object.")
    content_object = GenericForeignKey("content_type", "object_id")
    
    # Action metadata
    action = models.CharField(max_length=10, choices=ACTION_CHOICES, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
        help_text="User who performed the action."
    )
    acting_organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        help_text=_(
            "User's organisation at action time (GGGI / MoCCA attribution for publication and sensitive edits)."
        ),
    )
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    
    # Field-level change tracking
    field_name = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        db_index=True,
        help_text="Name of the field that was changed."
    )
    old_value = models.TextField(
        null=True, 
        blank=True,
        help_text="Previous value before the change."
    )
    new_value = models.TextField(
        null=True, 
        blank=True,
        help_text="New value after the change."
    )
    
    # Additional context
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        help_text="IP address of the user who made the change."
    )
    user_agent = models.TextField(
        null=True, 
        blank=True,
        help_text="Browser/client information."
    )
    
    # Metadata for complex objects
    object_repr = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="String representation of the object for easy identification."
    )

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["action", "timestamp"]),
            models.Index(fields=["field_name", "timestamp"]),
        ]

    def __str__(self):
        return f"{self.get_action_display()} {self.content_type.model} #{self.object_id} by {self.user}"

    @property
    def change_description(self):
        """Human-readable description of the change."""
        if self.action == self.ACTION_CREATE:
            return f"Created {self.content_type.model}"
        elif self.action == self.ACTION_DELETE:
            return f"Deleted {self.content_type.model}"
        elif self.field_name:
            return f"Changed {self.field_name} from '{self.old_value}' to '{self.new_value}'"
        return f"Updated {self.content_type.model}"
