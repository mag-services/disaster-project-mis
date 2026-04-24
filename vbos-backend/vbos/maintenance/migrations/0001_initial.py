# Generated migration for BackupLog

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BackupLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("backup_type", models.CharField(choices=[("full", "Full"), ("custom", "Custom")], default="full", max_length=20)),
                ("size_bytes", models.BigIntegerField(blank=True, null=True)),
                ("filename", models.CharField(blank=True, max_length=255)),
                ("included_categories", models.JSONField(blank=True, default=list, help_text="List of category keys included (e.g. app_data, rasters, vectors).")),
                ("file_path", models.CharField(blank=True, help_text="Relative path under MEDIA_ROOT/backups/ for stored backups.", max_length=512)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="backups_created", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "Backup log",
                "verbose_name_plural": "Backup logs",
                "ordering": ["-created_at"],
            },
        ),
    ]
