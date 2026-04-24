"""
Models for API/SQL integration with departmental MIS systems.
"""
import hashlib
import secrets
from django.db import models
from django.utils.translation import gettext_lazy as _


class IntegrationSource(models.Model):
    """
    Represents an external departmental MIS system (e.g. Health MIS, Agriculture).
    Used for audit and provenance when data is ingested via the integration API.
    """
    name = models.CharField(max_length=155)
    description = models.TextField(blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]
        verbose_name = _("Integration Source")
        verbose_name_plural = _("Integration Sources")


def _generate_key():
    return f"vbos_{secrets.token_urlsafe(32)}"


class IntegrationAPIKey(models.Model):
    """
    API key for machine-to-machine authentication from departmental MIS systems.
    Keys are hashed; only the prefix is stored for display.
    """
    PREFIX = "vbos_"
    KEY_LENGTH = 48  # prefix + 32 chars

    name = models.CharField(
        max_length=100,
        help_text="Descriptive name (e.g. Health MIS Production)",
    )
    source = models.ForeignKey(
        IntegrationSource,
        on_delete=models.CASCADE,
        related_name="api_keys",
        help_text="Departmental system this key belongs to",
    )
    key_hash = models.CharField(max_length=64, editable=False)
    key_prefix = models.CharField(max_length=20, editable=False)
    is_active = models.BooleanField(default=True)
    created = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.key_prefix}...)"

    @staticmethod
    def _hash_key(key: str) -> str:
        return hashlib.sha256(key.encode()).hexdigest()

    def check_key(self, raw_key: str) -> bool:
        return self.key_hash == self._hash_key(raw_key)

    @classmethod
    def create_key(cls, name: str, source: "IntegrationSource") -> str:
        """Create a new API key and return the raw key (shown once)."""
        raw_key = _generate_key()
        key_hash = cls._hash_key(raw_key)
        key_prefix = raw_key[:12] + "..."
        cls.objects.create(
            name=name,
            source=source,
            key_hash=key_hash,
            key_prefix=key_prefix,
        )
        return raw_key

    class Meta:
        ordering = ["-created"]
        verbose_name = _("Integration API Key")
        verbose_name_plural = _("Integration API Keys")


class ExternalDataSource(models.Model):
    """
    External system that Disaster MIS pulls data from.
    Configure URL, auth, and field mapping; run sync via management command or cron.
    """
    AUTH_NONE = "none"
    AUTH_BEARER = "bearer"
    AUTH_APIKEY = "apikey"
    AUTH_BASIC = "basic"
    AUTH_CHOICES = [
        (AUTH_NONE, "None"),
        (AUTH_BEARER, "Bearer Token"),
        (AUTH_APIKEY, "API Key (X-API-Key)"),
        (AUTH_BASIC, "HTTP Basic"),
    ]

    name = models.CharField(max_length=155)
    url = models.URLField(
        max_length=1024,
        help_text="API URL returning JSON array of records (e.g. https://health-mis.gov/api/export)",
    )
    auth_type = models.CharField(
        max_length=20,
        choices=AUTH_CHOICES,
        default=AUTH_NONE,
    )
    auth_config = models.JSONField(
        default=dict,
        blank=True,
        help_text='Auth config: {"token": "..."} for bearer, {"api_key": "..."} for apikey, {"username": "...", "password": "..."} for basic',
    )
    target_dataset = models.ForeignKey(
        "datasets.TabularDataset",
        on_delete=models.PROTECT,
        related_name="external_data_sources",
        help_text="Tabular dataset to sync data into",
    )
    field_mapping = models.JSONField(
        default=dict,
        help_text='Map external fields to ours: {"province": "Province", "area_council": "AreaCouncil", "attribute": "Metric", "date": "Date", "value": "Value"}',
    )
    is_active = models.BooleanField(default=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    last_sync_status = models.CharField(max_length=50, blank=True)  # success, error
    last_sync_error = models.TextField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} → {self.target_dataset.name}"

    class Meta:
        ordering = ["name"]
        verbose_name = _("External Data Source")
        verbose_name_plural = _("External Data Sources")
