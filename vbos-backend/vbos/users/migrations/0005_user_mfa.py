# Add 2FA fields to User

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_user_avatar"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="mfa_enabled",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="mfa_method",
            field=models.CharField(
                blank=True,
                choices=[("email", "Email code"), ("totp", "Authenticator app")],
                max_length=10,
            ),
        ),
    ]
