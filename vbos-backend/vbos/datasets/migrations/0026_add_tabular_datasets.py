# Add tabular datasets with cluster and type mapping

from django.db import migrations

# (cluster_name, dataset_name, type)
TABULAR_DATASETS = [
    # Education
    ("Education", "Education 01 baseline education", "baseline"),
    ("Education", "Education 02 damage estimates", "estimated_damage"),
    ("Education", "Education 03 resources needed", "aid_resources_needed"),
    ("Education", "Education 04 financial damage", "estimate_financial_damage"),
    # Energy
    ("Energy", "Energy 01 baseline", "baseline"),
    ("Energy", "Energy 02 damage estimates", "estimated_damage"),
    ("Energy", "Energy 03 resources needed", "aid_resources_needed"),
    ("Energy", "Energy 04a financial damage household electricity", "estimate_financial_damage"),
    ("Energy", "Energy 04b financial damage infrastructure", "estimate_financial_damage"),
    # Food security
    ("Food security", "FoodSecurity 01a baseline staple crops", "baseline"),
    ("Food security", "FoodSecurity 01b baseline cash crops", "baseline"),
    ("Food security", "FoodSecurity 02a damage staple crops", "estimated_damage"),
    ("Food security", "FoodSecurity 02b damage cash crops", "estimated_damage"),
    ("Food security", "FoodSecurity 03 resources needed", "aid_resources_needed"),
    ("Food security", "FoodSecurity 04a financial damage staple crops", "estimate_financial_damage"),
    ("Food security", "FoodSecurity 04b financial damage cash crops", "estimate_financial_damage"),
    # Gender & Protection
    ("Gender & Protection", "Gender & Protection 01a baseline population", "baseline"),
    ("Gender & Protection", "Gender & Protection 01b baseline marital status", "baseline"),
    ("Gender & Protection", "Gender & Protection 01c baseline employment status", "baseline"),
    ("Gender & Protection", "Gender & Protection 01d baseline functional difficulties", "baseline"),
    ("Gender & Protection", "Gender & Protection 02 resources needed", "aid_resources_needed"),
    # Health
    ("Health", "Health 01 baseline", "baseline"),
    ("Health", "Health 02 damage estimates", "estimated_damage"),
    ("Health", "Health 03 resources needed", "aid_resources_needed"),
    ("Health", "Health 04 financial damage", "estimate_financial_damage"),
    # Logistics
    ("Logistics", "Logistics 01a baseline infrastructure", "baseline"),
    ("Logistics", "Logistics 01b baseline road surface", "baseline"),
    ("Logistics", "Logistics 02a damage infrastructure", "estimated_damage"),
    ("Logistics", "Logistics 02b damage road surface", "estimated_damage"),
    ("Logistics", "Logistics 03 resources needed", "aid_resources_needed"),
    ("Logistics", "Logistics 04a financial damage infrastructure", "estimate_financial_damage"),
    ("Logistics", "Logistics 04b financial damage road surface", "estimate_financial_damage"),
    # Shelter
    ("Shelter", "Shelter 01 baseline", "baseline"),
    ("Shelter", "Shelter 02 estimated damage", "estimated_damage"),
    ("Shelter", "Shelter 03 resources", "aid_resources_needed"),
    ("Shelter", "Shelter 04 financial damage", "estimate_financial_damage"),
    # Telecom -> Emergency Telecommunications
    ("Emergency Telecommunications", "Telecom 01 baseline towers", "baseline"),
    ("Emergency Telecommunications", "Telecom 02 damage estimates", "estimated_damage"),
    # WASH
    ("WASH", "WASH 01 baseline", "baseline"),
    ("WASH", "WASH 02 estimated damage", "estimated_damage"),
    ("WASH", "WASH 03 immediate response resources", "aid_resources_needed"),
    ("WASH", "WASH 04 financial damage", "estimate_financial_damage"),
]


def add_tabular_datasets(apps, schema_editor):
    Cluster = apps.get_model("datasets", "Cluster")
    TabularDataset = apps.get_model("datasets", "TabularDataset")

    def get_or_create_cluster(name):
        """Get cluster by name (case-insensitive), or create if missing."""
        cluster = Cluster.objects.filter(name__iexact=name).first()
        if cluster is None:
            from django.db.models import Max
            max_order = Cluster.objects.aggregate(m=Max("order"))["m"] or 0
            cluster = Cluster.objects.create(name=name, order=max_order + 1)
        return cluster

    # Add datasets (create clusters on demand)
    for cluster_name, dataset_name, dataset_type in TABULAR_DATASETS:
        cluster = get_or_create_cluster(cluster_name)
        TabularDataset.objects.get_or_create(
            name=dataset_name,
            type=dataset_type,
            cluster=cluster,
            defaults={"description": ""},
        )


def remove_tabular_datasets(apps, schema_editor):
    TabularDataset = apps.get_model("datasets", "TabularDataset")
    dataset_names = [row[1] for row in TABULAR_DATASETS]
    TabularDataset.objects.filter(name__in=dataset_names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0025_add_cluster_order"),
    ]

    operations = [
        migrations.RunPython(add_tabular_datasets, reverse_code=remove_tabular_datasets),
    ]
