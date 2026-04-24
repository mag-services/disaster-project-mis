import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organisations", "0001_initial"),
        ("users", "0009_alter_smtpsettings_backend_default"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="organisation",
            field=models.ForeignKey(
                blank=True,
                help_text="Ministry or partner org (GGGI, MoCCA, …). Empty = platform operator / legacy full catalog access.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="users",
                to="organisations.organisation",
            ),
        ),
    ]
