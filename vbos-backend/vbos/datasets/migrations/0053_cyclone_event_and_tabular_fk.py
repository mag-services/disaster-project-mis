import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0052_dataset_owning_organisation"),
    ]

    operations = [
        migrations.CreateModel(
            name="CycloneEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(help_text='Display label, e.g. "Cyclone Lola".', max_length=155)),
                (
                    "slug",
                    models.SlugField(
                        help_text="Stable key for APIs and URLs, e.g. lola-2023.",
                        max_length=80,
                        unique=True,
                    ),
                ),
                ("season_year", models.PositiveSmallIntegerField(help_text="Tropical cyclone season year (e.g. 2023).")),
                ("started_on", models.DateField(blank=True, null=True)),
                ("ended_on", models.DateField(blank=True, null=True)),
                ("is_archived", models.BooleanField(db_index=True, default=False)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Cyclone event",
                "verbose_name_plural": "Cyclone events",
                "ordering": ["-season_year", "slug"],
            },
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="cyclone_event",
            field=models.ForeignKey(
                blank=True,
                help_text="Required for estimated damage, resources, and financial damage types (unless a RAP import batch is linked). Create under Cyclone events first.",
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tabular_datasets",
                to="datasets.cycloneevent",
            ),
        ),
    ]
