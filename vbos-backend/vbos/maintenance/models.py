"""Models for maintenance (backup/restore)."""
from django.db import models


class BackupLog(models.Model):
    """Metadata for each backup created by the system."""

    BACKUP_TYPE_FULL = "full"
    BACKUP_TYPE_CUSTOM = "custom"
    BACKUP_TYPE_CHOICES = [
        (BACKUP_TYPE_FULL, "Full"),
        (BACKUP_TYPE_CUSTOM, "Custom"),
    ]

    created_at = models.DateTimeField(auto_now_add=True)
    backup_type = models.CharField(max_length=20, choices=BACKUP_TYPE_CHOICES, default=BACKUP_TYPE_FULL)
    size_bytes = models.BigIntegerField(null=True, blank=True)
    filename = models.CharField(max_length=255, blank=True)
    included_categories = models.JSONField(
        default=list,
        blank=True,
        help_text="List of category keys included (e.g. app_data, rasters, vectors).",
    )
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="backups_created",
    )
    file_path = models.CharField(
        max_length=512,
        blank=True,
        help_text="Relative path under MEDIA_ROOT/backups/ for stored backups.",
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Backup log"
        verbose_name_plural = "Backup logs"

    def __str__(self):
        return f"{self.filename or 'backup'} ({self.created_at:%Y-%m-%d %H:%M})"

    @property
    def size_display(self):
        if self.size_bytes is None:
            return "—"
        n = float(self.size_bytes)
        for unit in ("B", "KB", "MB", "GB"):
            if n < 1024:
                return f"{n:.1f} {unit}"
            n /= 1024
        return f"{n:.1f} TB"
