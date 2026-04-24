import uuid
from django.db import models
from django.conf import settings
from django.dispatch import receiver
from django.contrib.auth.models import AbstractUser
from django.db.models.signals import post_save
from rest_framework.authtoken.models import Token

MFA_EMAIL = "email"
MFA_TOTP = "totp"
MFA_CHOICES = [(MFA_EMAIL, "Email code"), (MFA_TOTP, "Authenticator app")]


EMAIL_BACKEND_SMTP = "smtp"
EMAIL_BACKEND_CONSOLE = "console"


class SMTPSettings(models.Model):
    """
    Singleton model for SMTP configuration. Used for OTP emails and other transactional mail.
    Falls back to Django EMAIL_* settings when backend is 'django_default'.
    """
    BACKEND_CHOICES = [
        (EMAIL_BACKEND_SMTP, "SMTP (configure host, port, credentials below)"),
        (EMAIL_BACKEND_CONSOLE, "Console (prints to terminal, for local development)"),
        ("django_default", "Use Django settings (EMAIL_HOST, etc. from environment)"),
    ]
    backend = models.CharField(
        max_length=20,
        choices=BACKEND_CHOICES,
        default=EMAIL_BACKEND_SMTP,
        help_text="How to send email",
    )
    host = models.CharField(max_length=255, default="localhost", help_text="SMTP server hostname")
    port = models.PositiveIntegerField(default=587, help_text="SMTP port (587 for TLS, 465 for SSL)")
    use_tls = models.BooleanField(default=True, help_text="Use TLS (recommended for port 587)")
    use_ssl = models.BooleanField(default=False, help_text="Use SSL (for port 465)")
    username = models.CharField(max_length=255, blank=True, help_text="SMTP username (leave blank if no auth)")
    password = models.CharField(max_length=255, blank=True, help_text="SMTP password")
    from_email = models.CharField(
        max_length=255,
        default="noreply@example.com",
        help_text="Default 'From' address for outgoing mail",
    )
    fail_silently = models.BooleanField(
        default=False,
        help_text="If True, do not raise on send errors (use only for debugging)",
    )
    otp_required_for_all_logins = models.BooleanField(
        default=True,
        help_text="When enabled, every login requires a 6-digit code sent to email. When disabled, users can optionally enable 2FA in their profile.",
    )

    class Meta:
        verbose_name = "SMTP settings"
        verbose_name_plural = "SMTP settings"

    def __str__(self):
        return f"SMTP: {self.host}:{self.port}"

    @classmethod
    def get_solo(cls):
        """Return the single SMTPSettings instance, creating one if needed."""
        obj, _ = cls.objects.get_or_create(
            pk=1,
            defaults={
                "backend": EMAIL_BACKEND_CONSOLE,
                "host": "localhost",
                "port": 587,
            },
        )
        return obj


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organisation = models.ForeignKey(
        "organisations.Organisation",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="users",
        help_text="Ministry or partner org (GGGI, MoCCA, …). Empty = platform operator / legacy full catalog access.",
    )
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_method = models.CharField(
        max_length=10, choices=MFA_CHOICES, blank=True
    )

    def __str__(self):
        return self.username


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)
