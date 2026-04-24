from django.db import migrations, models


def set_default_title(apps, schema_editor):
    """Set title for existing records that have 2020–2023 data."""
    LandAccountsData = apps.get_model("land_accounts", "LandAccountsData")
    for obj in LandAccountsData.objects.filter(title=""):
        obj.title = "2020–2023"
        obj.save()


class Migration(migrations.Migration):

    dependencies = [
        ("land_accounts", "0002_seed_initial_data"),
    ]

    operations = [
        migrations.AddField(
            model_name="landaccountsdata",
            name="title",
            field=models.CharField(
                blank=True,
                default="",
                help_text="e.g. 2020–2023, or a short description of this land account period.",
                max_length=100,
            ),
        ),
        migrations.RunPython(set_default_title, migrations.RunPython.noop),
    ]
