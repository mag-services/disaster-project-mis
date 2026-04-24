# MapAnnotation model for stakeholder annotations (e.g. suggested school names)

from django.conf import settings
from django.db import migrations, models
import django.contrib.gis.db.models.fields


class Migration(migrations.Migration):

    dependencies = [
        ("datasets", "0027_add_raster_is_land_cover"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MapAnnotation",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("geometry", django.contrib.gis.db.models.fields.PointField(srid=4326)),
                ("note", models.CharField(help_text="Suggested name or note", max_length=500)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "created_by",
                    models.ForeignKey(on_delete=models.CASCADE, to=settings.AUTH_USER_MODEL),
                ),
                (
                    "vector_item",
                    models.ForeignKey(
                        blank=True,
                        help_text="Vector item this annotation refers to (e.g. school to name)",
                        null=True,
                        on_delete=models.CASCADE,
                        to="datasets.vectoritem",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
