# Generated manually to seed default clusters for initial setup

from django.db import migrations


def seed_clusters(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    default_clusters = [
        "Administrative",
        "Environment",
        "Education",
        "Statistics",
        "Transportation",
    ]
    for name in default_clusters:
        Cluster.objects.get_or_create(name=name)


def reverse_seed_clusters(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    default_clusters = [
        "Administrative",
        "Environment",
        "Education",
        "Statistics",
        "Transportation",
    ]
    Cluster.objects.filter(name__in=default_clusters).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("datasets", "0021_pmtilesdataset"),
    ]

    operations = [
        migrations.RunPython(seed_clusters, reverse_code=reverse_seed_clusters),
    ]
