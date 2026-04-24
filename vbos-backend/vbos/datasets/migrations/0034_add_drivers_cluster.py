# Add Drivers cluster for Climate mode overlays (Population growth, Roads, Urban expansion)

from django.db import migrations
from django.db.models import Max


def add_drivers_cluster(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    if not Cluster.objects.filter(name="Drivers").exists():
        max_order = Cluster.objects.aggregate(m=Max("order"))["m"] or 0
        Cluster.objects.create(name="Drivers", order=max_order + 1)


def remove_drivers_cluster(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    Cluster.objects.filter(name="Drivers").delete()


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0033_add_precomputed_tile_url"),
    ]

    operations = [
        migrations.RunPython(add_drivers_cluster, reverse_code=remove_drivers_cluster),
    ]
