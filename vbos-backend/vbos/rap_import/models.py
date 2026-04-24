"""Models for RAP (disaster-project-rap) CSV import batches and files."""

from django.conf import settings
from django.db import models


class RAPImportBatch(models.Model):
    """
    Tracks a single Cyclone RAP export batch.
    One batch = one cyclone event rendered from the Quarto RAP tool.
    Produces the three DRMIS cyclone output types:
      - estimated_damage (physical damage by sector)
      - aid_resources_needed (immediate response resources)
      - estimate_financial_damage (financial damage by sector)
    Links all imported CSVs for one event under one batch reference.
    """

    batch_ref = models.CharField(
        max_length=50,
        unique=True,
        help_text="e.g. TC-HAROLD-2026 — must be unique per cyclone event",
    )
    cyclone_event = models.ForeignKey(
        "datasets.CycloneEvent",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="rap_batches",
        help_text="Link to DRMIS cyclone record (recommended for new batches).",
    )
    cyclone_name = models.CharField(max_length=100)
    event_year = models.PositiveSmallIntegerField()
    rendered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the Quarto RAP was rendered (from CSV metadata if available)",
    )
    imported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        on_delete=models.SET_NULL,
        related_name="rap_import_batches",
    )
    imported_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("importing", "Importing"),
            ("complete", "Complete"),
            ("failed", "Failed"),
        ],
        default="pending",
    )
    # Intensity summary — populated after hazard CSV is parsed
    max_intensity = models.PositiveSmallIntegerField(null=True, blank=True)
    provinces_affected = models.JSONField(default=list)  # e.g. ["Tafea", "Malampa", ...]
    councils_affected = models.JSONField(default=list)  # Area Council names

    class Meta:
        ordering = ["-imported_at"]
        verbose_name = "RAP Import Batch"
        verbose_name_plural = "RAP Import Batches"

    def __str__(self):
        return f"{self.batch_ref} ({self.event_year})"


class RAPImportFile(models.Model):
    """
    One uploaded CSV file within a batch.

    sector_family matches the RAP output prefix:
    education | energy | food_security | gender_protection | health |
    logistics | shelter | telecom | wash | qc | hazard
    """

    SECTOR_CHOICES = [
        ("education", "Education"),
        ("energy", "Energy"),
        ("food_security", "Food Security"),
        ("gender_protection", "Gender & Protection"),
        ("health", "Health"),
        ("logistics", "Logistics"),
        ("shelter", "Shelter"),
        ("telecom", "Telecom"),
        ("wash", "WASH"),
        ("qc", "Quality Control"),
        ("hazard", "Hazard (Intensity)"),
    ]

    batch = models.ForeignKey(
        RAPImportBatch,
        on_delete=models.CASCADE,
        related_name="files",
    )
    sector_family = models.CharField(max_length=30, choices=SECTOR_CHOICES)
    original_filename = models.CharField(max_length=255)
    file = models.FileField(upload_to="rap_imports/%Y/%m/")
    row_count = models.PositiveIntegerField(null=True, blank=True)
    columns_detected = models.JSONField(default=list)
    parse_errors = models.JSONField(default=list)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("ok", "OK"),
            ("error", "Error"),
        ],
        default="pending",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["sector_family"]

    def __str__(self):
        return f"{self.batch.batch_ref} / {self.original_filename}"
