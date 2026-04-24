# Dataset publication: Draft / Published / Archived + published_by / published_at

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
from django.db.models import F


def forwards_set_existing_published(apps, schema_editor):
    RasterDataset = apps.get_model("datasets", "RasterDataset")
    VectorDataset = apps.get_model("datasets", "VectorDataset")
    PMTilesDataset = apps.get_model("datasets", "PMTilesDataset")
    TabularDataset = apps.get_model("datasets", "TabularDataset")
    published = "published"
    for Model in (RasterDataset, VectorDataset, PMTilesDataset, TabularDataset):
        Model.objects.all().update(
            publication_status=published,
            published_at=F("updated"),
        )
    # Fallback if updated were ever null
    for Model in (RasterDataset, VectorDataset, PMTilesDataset, TabularDataset):
        Model.objects.filter(published_at__isnull=True).update(published_at=F("created"))


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("datasets", "0047_alter_vectordataset_color_hex"),
    ]

    operations = [
        migrations.AddField(
            model_name="rasterdataset",
            name="publication_status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="rasterdataset",
            name="published_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="rasterdataset",
            name="published_by",
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
            name="publication_status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="published_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="vectordataset",
            name="published_by",
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
            name="publication_status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="pmtilesdataset",
            name="published_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="pmtilesdataset",
            name="published_by",
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
            name="publication_status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("published", "Published"),
                    ("archived", "Archived"),
                ],
                db_index=True,
                default="draft",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="published_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="tabulardataset",
            name="published_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="+",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(forwards_set_existing_published, noop_reverse),
    ]
