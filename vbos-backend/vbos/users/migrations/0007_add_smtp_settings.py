# Add SMTP settings model for admin-configurable email

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_role"),
    ]

    operations = [
        migrations.CreateModel(
            name="SMTPSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "backend",
                    models.CharField(
                        choices=[
                            ("smtp", "SMTP (configure host, port, credentials below)"),
                            ("console", "Console (prints to terminal, for local development)"),
                            ("django_default", "Use Django settings (EMAIL_HOST, etc. from environment)"),
                        ],
                        default="console",
                        help_text="How to send email",
                        max_length=20,
                    ),
                ),
                ("host", models.CharField(default="localhost", help_text="SMTP server hostname", max_length=255)),
                ("port", models.PositiveIntegerField(default=587, help_text="SMTP port (587 for TLS, 465 for SSL)")),
                ("use_tls", models.BooleanField(default=True, help_text="Use TLS (recommended for port 587)")),
                ("use_ssl", models.BooleanField(default=False, help_text="Use SSL (for port 465)")),
                ("username", models.CharField(blank=True, help_text="SMTP username (leave blank if no auth)", max_length=255)),
                ("password", models.CharField(blank=True, help_text="SMTP password", max_length=255)),
                (
                    "from_email",
                    models.CharField(
                        default="noreply@example.com",
                        help_text="Default 'From' address for outgoing mail",
                        max_length=255,
                    ),
                ),
                (
                    "fail_silently",
                    models.BooleanField(
                        default=False,
                        help_text="If True, do not raise on send errors (use only for debugging)",
                    ),
                ),
            ],
            options={
                "verbose_name": "SMTP settings",
                "verbose_name_plural": "SMTP settings",
            },
        ),
    ]
