from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="CoastalChangesData",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "title",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="e.g. 2020–2023, or a short description of this coastal change period.",
                        max_length=100,
                    ),
                ),
                (
                    "data",
                    models.JSONField(
                        default=dict,
                        help_text="Coastal changes by province and year. Keys: provinces (object).",
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Coastal Changes Data",
                "verbose_name_plural": "Coastal Changes Data",
            },
        ),
    ]
