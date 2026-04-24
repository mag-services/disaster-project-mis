# Add otp_required_for_all_logins to SMTPSettings for admin toggle

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_add_smtp_settings"),
    ]

    operations = [
        migrations.AddField(
            model_name="smtpsettings",
            name="otp_required_for_all_logins",
            field=models.BooleanField(
                default=True,
                help_text="When enabled, every login requires a 6-digit code sent to email. When disabled, users can optionally enable 2FA in their profile.",
            ),
        ),
    ]
