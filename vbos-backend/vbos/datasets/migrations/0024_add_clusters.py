# Generated manually to add clusters

from django.db import migrations

CLUSTERS = [
    "Education",
    "Emergency Telecommunications",
    "Energy",
    "Food security",
    "Gender & Protection",
    "Health",
    "Logistics",
    "Shelter",
    "WASH",
    "Business",
]


def add_clusters(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    for name in CLUSTERS:
        Cluster.objects.get_or_create(name=name)


def remove_clusters(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    Cluster.objects.filter(name__in=CLUSTERS).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0023_add_tabular_item_indexes"),
    ]

    operations = [
        migrations.RunPython(add_clusters, reverse_code=remove_clusters),
    ]
