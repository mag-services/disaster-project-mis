from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="LandAccountsData",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "data",
                    models.JSONField(
                        default=dict,
                        help_text="Land accounts by province. Keys: provinces (object).",
                    ),
                ),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Land Accounts Data",
                "verbose_name_plural": "Land Accounts Data",
            },
        ),
    ]
