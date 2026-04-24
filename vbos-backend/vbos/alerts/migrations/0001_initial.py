import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("datasets", "0045_tabular_rap_fields"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Alert",
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
                ("title", models.CharField(max_length=255)),
                ("summary", models.TextField(blank=True)),
                (
                    "alert_type",
                    models.CharField(
                        choices=[
                            ("earthquake", "Earthquake"),
                            ("cyclone", "Cyclone / Tropical Cyclone"),
                            ("flood", "Flood"),
                            ("volcano", "Volcanic Activity"),
                            ("weather", "Weather Warning"),
                            ("hazard", "General Hazard"),
                            ("wildfire", "Wildfire"),
                            ("drought", "Drought"),
                            ("operational", "Operational Update"),
                        ],
                        default="operational",
                        max_length=20,
                    ),
                ),
                (
                    "severity",
                    models.CharField(
                        choices=[
                            ("critical", "Critical"),
                            ("high", "High"),
                            ("medium", "Medium"),
                            ("low", "Low"),
                            ("info", "Info"),
                        ],
                        default="info",
                        max_length=10,
                    ),
                ),
                (
                    "source",
                    models.CharField(
                        choices=[
                            ("DRMIS", "DRMIS (Internal)"),
                            ("USGS", "USGS Earthquake Hazards"),
                            ("VMGD", "Vanuatu Met & Geo-hazards Dept"),
                            ("GDACS", "Global Disaster Alert & Coord System"),
                        ],
                        default="DRMIS",
                        editable=False,
                        max_length=10,
                    ),
                ),
                (
                    "url",
                    models.URLField(
                        blank=True,
                        help_text="External reference URL (optional)",
                        max_length=1024,
                    ),
                ),
                (
                    "issued_at",
                    models.DateTimeField(
                        help_text="When the alert was originally issued / observed"
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Uncheck to hide this alert from the live feed",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        editable=False,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "province",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="alerts",
                        to="datasets.province",
                    ),
                ),
            ],
            options={
                "verbose_name": "Alert",
                "verbose_name_plural": "Alerts",
                "ordering": ["-issued_at"],
            },
        ),
    ]
