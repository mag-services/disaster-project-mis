# Generated manually for integrations app

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="IntegrationSource",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=155)),
                ("description", models.TextField(blank=True, null=True)),
                ("contact_email", models.EmailField(blank=True, max_length=254, null=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("updated", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Integration Source",
                "verbose_name_plural": "Integration Sources",
                "ordering": ["name"],
            },
        ),
        migrations.CreateModel(
            name="IntegrationAPIKey",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(help_text="Descriptive name (e.g. Health MIS Production)", max_length=100)),
                ("key_hash", models.CharField(editable=False, max_length=64)),
                ("key_prefix", models.CharField(editable=False, max_length=20)),
                ("is_active", models.BooleanField(default=True)),
                ("created", models.DateTimeField(auto_now_add=True)),
                ("last_used", models.DateTimeField(blank=True, null=True)),
                (
                    "source",
                    models.ForeignKey(
                        help_text="Departmental system this key belongs to",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="api_keys",
                        to="integrations.integrationsource",
                    ),
                ),
            ],
            options={
                "verbose_name": "Integration API Key",
                "verbose_name_plural": "Integration API Keys",
                "ordering": ["-created"],
            },
        ),
    ]
