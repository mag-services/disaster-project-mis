# Initial migration for RAP import batch / file models

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="RAPImportBatch",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "batch_ref",
                    models.CharField(
                        help_text="e.g. TC-HAROLD-2026 — must be unique per cyclone event",
                        max_length=50,
                        unique=True,
                    ),
                ),
                ("cyclone_name", models.CharField(max_length=100)),
                ("event_year", models.PositiveSmallIntegerField()),
                (
                    "rendered_at",
                    models.DateTimeField(
                        blank=True,
                        help_text="When the Quarto RAP was rendered (from CSV metadata if available)",
                        null=True,
                    ),
                ),
                ("imported_at", models.DateTimeField(auto_now_add=True)),
                ("notes", models.TextField(blank=True)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("importing", "Importing"),
                            ("complete", "Complete"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                (
                    "max_intensity",
                    models.PositiveSmallIntegerField(blank=True, null=True),
                ),
                ("provinces_affected", models.JSONField(default=list)),
                ("councils_affected", models.JSONField(default=list)),
                (
                    "imported_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="rap_import_batches",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "RAP Import Batch",
                "verbose_name_plural": "RAP Import Batches",
                "ordering": ["-imported_at"],
            },
        ),
        migrations.CreateModel(
            name="RAPImportFile",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "sector_family",
                    models.CharField(
                        choices=[
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
                        ],
                        max_length=30,
                    ),
                ),
                ("original_filename", models.CharField(max_length=255)),
                ("file", models.FileField(upload_to="rap_imports/%Y/%m/")),
                ("row_count", models.PositiveIntegerField(blank=True, null=True)),
                ("columns_detected", models.JSONField(default=list)),
                ("parse_errors", models.JSONField(default=list)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("ok", "OK"),
                            ("error", "Error"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                (
                    "batch",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="files",
                        to="rap_import.rapimportbatch",
                    ),
                ),
            ],
            options={
                "ordering": ["sector_family"],
            },
        ),
    ]
