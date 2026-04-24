"""
Field check records for damage estimation verification.
Tracks confidence improvement: no record = model, verified/adjusted/rejected = from field.
"""
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from vbos.audit.signals import AuditableMixin, log_audit_action, get_field_changes


class FieldCheckRecord(AuditableMixin, models.Model):
    """
    One field verification event for a damage estimate item.
    Confidence is derived from the latest record per item:
    - No record → model (RAP estimate, not checked)
    - verified → field_verified
    - adjusted → field_adjusted
    - rejected → rejected
    """
    STATUS_VERIFIED = "verified"
    STATUS_ADJUSTED = "adjusted"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_VERIFIED, _("Verified")),
        (STATUS_ADJUSTED, _("Adjusted")),
        (STATUS_REJECTED, _("Rejected")),
    ]

    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        limit_choices_to={"model__in": ("tabularitem", "vectoritem")},
    )
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, db_index=True)
    observed_value = models.FloatField(
        null=True,
        blank=True,
        help_text="Field-observed value when status is adjusted.",
    )
    notes = models.TextField(blank=True)

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="field_check_records",
    )
    verified_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-verified_at"]
        verbose_name = "Field Check Record"
        verbose_name_plural = "Field Check Records"
        indexes = [
            models.Index(fields=["content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.get_status_display()} by {self.verified_by.username} at {self.verified_at}"
