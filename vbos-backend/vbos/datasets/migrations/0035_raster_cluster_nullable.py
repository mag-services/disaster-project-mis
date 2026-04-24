# Raster datasets are Climate-mode only and not tied to a particular cluster.
# Make cluster nullable and change unique_together to (name, type).

from django.db import migrations, models
import django.db.models.deletion


def clear_cluster_and_dedupe(apps, schema_editor):
    """Set cluster to null and keep one raster per (name, type)."""
    RasterDataset = apps.get_model("datasets", "RasterDataset")
    # Keep lowest id per (name, type), delete the rest
    seen = {}
    for r in RasterDataset.objects.order_by("id"):
        key = (r.name, r.type)
        if key in seen:
            r.delete()
        else:
            seen[key] = r
            r.cluster_id = None
            r.save()


def noop_reverse(apps, schema_editor):
    """Cannot restore cluster assignment; no-op."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0034_add_drivers_cluster"),
    ]

    operations = [
        migrations.AlterField(
            model_name="rasterdataset",
            name="cluster",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="datasets.cluster",
            ),
        ),
        migrations.RunPython(clear_cluster_and_dedupe, noop_reverse),
        migrations.AlterUniqueTogether(
            name="rasterdataset",
            unique_together={("name", "type")},
        ),
    ]
