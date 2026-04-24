# Generated manually for RAP provenance on tabular data

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("rap_import", "0001_initial"),
        ("datasets", "0044_remove_non_official_clusters"),
    ]

    operations = [
        migrations.AddField(
            model_name="tabularitem",
            name="intensity",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="rap_batch",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="tabular_datasets",
                to="rap_import.rapimportbatch",
            ),
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="rap_sector_family",
            field=models.CharField(
                blank=True,
                help_text="RAP sector_family when sourced from RAP CSV (education, hazard, …).",
                max_length=30,
                null=True,
            ),
        ),
    ]
