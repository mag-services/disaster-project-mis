# Generated manually for Area Administrator workflow

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("datasets", "0042_alter_cluster_options_alter_pmtilesdataset_options_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="AreaAdministrator",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("updated", models.DateTimeField(auto_now=True)),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="area_administrator",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "area_councils",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Area councils this administrator can enter data for.",
                        related_name="area_administrators",
                        to="datasets.areacouncil",
                    ),
                ),
                (
                    "provinces",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Provinces this administrator can enter data for (province-level only).",
                        related_name="area_administrators",
                        to="datasets.province",
                    ),
                ),
            ],
            options={
                "verbose_name": "Area Administrator",
                "verbose_name_plural": "Area Administrators",
            },
        ),
        migrations.CreateModel(
            name="AreaDataSubmission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("year", models.PositiveIntegerField()),
                (
                    "items",
                    models.JSONField(
                        default=list,
                        help_text="List of {attribute, value} pairs. Matches TabularItem structure.",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "Draft"),
                            ("submitted", "Pending approval"),
                            ("approved", "Approved"),
                            ("rejected", "Rejected"),
                        ],
                        db_index=True,
                        default="draft",
                        max_length=20,
                    ),
                ),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("rejection_reason", models.TextField(blank=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("updated", models.DateTimeField(auto_now=True)),
                (
                    "area_council",
                    models.ForeignKey(
                        blank=True,
                        help_text="Null = province-level data.",
                        null=True,
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="area_submissions",
                        to="datasets.areacouncil",
                    ),
                ),
                (
                    "dataset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="area_submissions",
                        to="datasets.tabulardataset",
                    ),
                ),
                (
                    "province",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="area_submissions",
                        to="datasets.province",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_submissions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "submitted_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="area_submissions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Area Data Submission",
                "verbose_name_plural": "Area Data Submissions",
                "ordering": ["-updated"],
                "unique_together": {("dataset", "province", "area_council", "year")},
            },
        ),
    ]
