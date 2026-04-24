# Remove non-official clusters seeded by 0022 (Administrative, Statistics, etc.)
# Keep only official humanitarian clusters from 0024, 0034, 0040

from django.db import migrations


# Clusters from 0022_seed_default_clusters that are NOT official humanitarian clusters
NON_OFFICIAL_CLUSTERS = [
    "Administrative",
    "Statistics",
    "Environment",
    "Transportation",
]
# Note: "Education" from 0022 is kept - it's an official cluster also in 0024


def remove_non_official_clusters(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    TabularDataset = apps.get_model("datasets", "TabularDataset")
    VectorDataset = apps.get_model("datasets", "VectorDataset")
    PMTilesDataset = apps.get_model("datasets", "PMTilesDataset")

    for name in NON_OFFICIAL_CLUSTERS:
        cluster = Cluster.objects.filter(name=name).first()
        if cluster is None:
            continue
        # Only delete if no datasets reference it
        has_tabular = TabularDataset.objects.filter(cluster=cluster).exists()
        has_vector = VectorDataset.objects.filter(cluster=cluster).exists()
        has_pmtiles = PMTilesDataset.objects.filter(cluster=cluster).exists()
        if not (has_tabular or has_vector or has_pmtiles):
            cluster.delete()


def noop_reverse(apps, schema_editor):
    """Cannot restore; clusters would need to be re-seeded manually if required."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0043_alter_pmtilesdataset_climate_modules_and_more"),
    ]

    operations = [
        migrations.RunPython(remove_non_official_clusters, reverse_code=noop_reverse),
    ]
