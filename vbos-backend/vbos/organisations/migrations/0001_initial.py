# Generated manually for Organisation RBAC

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("contenttypes", "0002_remove_content_type_name"),
        ("datasets", "0051_vectordataset_popup_properties"),
    ]

    operations = [
        migrations.CreateModel(
            name="Organisation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(help_text="Display name, e.g. Global Green Growth Institute", max_length=255)),
                (
                    "slug",
                    models.SlugField(
                        help_text="Stable identifier, e.g. gggi, mocca, vbos",
                        max_length=100,
                        unique=True,
                    ),
                ),
                ("short_name", models.CharField(blank=True, help_text="Abbreviation for UI", max_length=64)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("notes", models.TextField(blank=True, help_text="Internal notes (partnership, MOU, etc.)")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Organisation",
                "verbose_name_plural": "Organisations",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="OrganisationClusterAccess",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("can_view", models.BooleanField(default=True)),
                (
                    "can_edit",
                    models.BooleanField(
                        default=False,
                        help_text="Intended for future API/admin write paths; document in runbooks until enforced everywhere.",
                    ),
                ),
                (
                    "can_publish",
                    models.BooleanField(
                        default=False,
                        help_text="Allows moving datasets to Published / Archived where enforced.",
                    ),
                ),
                (
                    "cluster",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="organisation_access",
                        to="datasets.cluster",
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="cluster_access",
                        to="organisations.organisation",
                    ),
                ),
            ],
            options={
                "verbose_name": "Organisation cluster access",
                "verbose_name_plural": "Organisation cluster access",
                "unique_together": {("organisation", "cluster")},
            },
        ),
        migrations.CreateModel(
            name="DatasetOrganisationShare",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("object_id", models.PositiveIntegerField()),
                ("can_view", models.BooleanField(default=True)),
                ("can_edit", models.BooleanField(default=False)),
                ("can_publish", models.BooleanField(default=False)),
                (
                    "content_type",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="contenttypes.contenttype"),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="dataset_shares",
                        to="organisations.organisation",
                    ),
                ),
            ],
            options={
                "verbose_name": "Dataset organisation share",
                "verbose_name_plural": "Dataset organisation shares",
                "unique_together": {("organisation", "content_type", "object_id")},
            },
        ),
        migrations.AddIndex(
            model_name="datasetorganisationshare",
            index=models.Index(
                fields=["organisation", "content_type", "object_id"],
                name="orgs_dataset_share_lookup",
            ),
        ),
    ]
