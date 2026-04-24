# Dataset created_by/updated_by; DisasterDatasetTag for configurable disaster overlay names

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def seed_disaster_tags(apps, schema_editor):
    DisasterDatasetTag = apps.get_model("datasets", "DisasterDatasetTag")
    names = [
        "Cyclone Intensity",
        "Volcano",
        "Flood",
        "Earthquake",
        "Tsunami",
        "Landslide",
        "Drought",
        "Wildfire",
    ]
    for i, name in enumerate(names):
        DisasterDatasetTag.objects.get_or_create(name=name, defaults={"order": i})


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("datasets", "0048_dataset_publication_governance"),
    ]

    operations = [
        migrations.CreateModel(
            name="DisasterDatasetTag",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=155, unique=True)),
                ("order", models.PositiveIntegerField(db_index=True, default=0)),
            ],
            options={
                "verbose_name": "Disaster dataset tag",
                "verbose_name_plural": "Disaster dataset tags",
                "ordering": ["order", "name"],
            },
        ),
        migrations.AddField(
            model_name="rasterdataset",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="rasterdataset",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="pmtilesdataset",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="pmtilesdataset",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="updated_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(seed_disaster_tags, noop_reverse),
    ]
