# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0002_tabulardataset_tabularitem"),
        ("integrations", "0001_add_integration_models"),
    ]

    operations = [
        migrations.CreateModel(
            name="ExternalDataSource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=155)),
                ("url", models.URLField(help_text="API URL returning JSON array of records (e.g. https://health-mis.gov/api/export)", max_length=1024)),
                ("auth_type", models.CharField(choices=[("none", "None"), ("bearer", "Bearer Token"), ("apikey", "API Key (X-API-Key)"), ("basic", "HTTP Basic")], default="none", max_length=20)),
                ("auth_config", models.JSONField(blank=True, default=dict, help_text='Auth config: {"token": "..."} for bearer, {"api_key": "..."} for apikey, {"username": "...", "password": "..."} for basic')),
                ("field_mapping", models.JSONField(default=dict, help_text='Map external fields to ours: {"province": "Province", "area_council": "AreaCouncil", "attribute": "Metric", "date": "Date", "value": "Value"}')),
                ("is_active", models.BooleanField(default=True)),
                ("last_sync", models.DateTimeField(blank=True, null=True)),
                ("last_sync_status", models.CharField(blank=True, max_length=50)),
                ("last_sync_error", models.TextField(blank=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("updated", models.DateTimeField(auto_now=True)),
                ("target_dataset", models.ForeignKey(help_text="Tabular dataset to sync data into", on_delete=django.db.models.deletion.PROTECT, related_name="external_data_sources", to="datasets.tabulardataset")),
            ],
            options={
                "verbose_name": "External Data Source",
                "verbose_name_plural": "External Data Sources",
                "ordering": ["name"],
            },
        ),
    ]
