from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AlertType(models.TextChoices):
    EARTHQUAKE = "earthquake", _("Earthquake")
    CYCLONE = "cyclone", _("Cyclone / Tropical Cyclone")
    FLOOD = "flood", _("Flood")
    VOLCANO = "volcano", _("Volcanic Activity")
    WEATHER = "weather", _("Weather Warning")
    HAZARD = "hazard", _("General Hazard")
    WILDFIRE = "wildfire", _("Wildfire")
    DROUGHT = "drought", _("Drought")
    OPERATIONAL = "operational", _("Operational Update")


class AlertSeverity(models.TextChoices):
    CRITICAL = "critical", _("Critical")
    HIGH = "high", _("High")
    MEDIUM = "medium", _("Medium")
    LOW = "low", _("Low")
    INFO = "info", _("Info")


class AlertSource(models.TextChoices):
    DRMIS = "DRMIS", _("DRMIS (Internal)")
    USGS = "USGS", _("USGS Earthquake Hazards")
    VMGD = "VMGD", _("Vanuatu Met & Geo-hazards Dept")
    GDACS = "GDACS", _("Global Disaster Alert & Coord System")


class Alert(models.Model):
    """
    Live alert record. Internal (DRMIS-authored) and external (USGS/VMGD/GDACS)
    alerts are stored separately; this model covers internal/operational ones.
    External alerts are fetched at request-time and never persisted.
    """

    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    alert_type = models.CharField(
        max_length=20,
        choices=AlertType.choices,
        default=AlertType.OPERATIONAL,
    )
    severity = models.CharField(
        max_length=10,
        choices=AlertSeverity.choices,
        default=AlertSeverity.INFO,
    )
    source = models.CharField(
        max_length=10,
        choices=AlertSource.choices,
        default=AlertSource.DRMIS,
        editable=False,
    )
    province = models.ForeignKey(
        "datasets.Province",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="alerts",
    )
    url = models.URLField(
        max_length=1024,
        blank=True,
        help_text="External reference URL (optional)",
    )
    issued_at = models.DateTimeField(
        help_text="When the alert was originally issued / observed",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Uncheck to hide this alert from the live feed",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        editable=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-issued_at"]
        verbose_name = _("Alert")
        verbose_name_plural = _("Alerts")

    def __str__(self):
        return f"[{self.get_severity_display()}] {self.title}"
