# Align SMTPSettings.backend default with models (smtp vs legacy migration default console)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0008_smtpsettings_otp_required_for_all_logins"),
    ]

    operations = [
        migrations.AlterField(
            model_name="smtpsettings",
            name="backend",
            field=models.CharField(
                choices=[
                    ("smtp", "SMTP (configure host, port, credentials below)"),
                    ("console", "Console (prints to terminal, for local development)"),
                    ("django_default", "Use Django settings (EMAIL_HOST, etc. from environment)"),
                ],
                default="smtp",
                help_text="How to send email",
                max_length=20,
            ),
        ),
    ]
