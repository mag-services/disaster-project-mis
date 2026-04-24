"""
Disable 2FA for a user. Use when locked out (e.g. authenticator app lost or clock drift).
Run: ./manage.py disable_2fa admin
     ./manage.py disable_2fa --all   # disable for all users
"""
from django.core.management.base import BaseCommand
from django_otp.plugins.otp_totp.models import TOTPDevice

from vbos.users.models import User


class Command(BaseCommand):
    help = "Disable two-factor authentication for a user (e.g. when locked out)."

    def add_arguments(self, parser):
        parser.add_argument("username", nargs="?", type=str, help="Username of the user to disable 2FA for")
        parser.add_argument("--all", action="store_true", help="Disable 2FA for all users")

    def handle(self, *args, **options):
        if options["all"]:
            users = User.objects.filter(mfa_enabled=True)
            if not users:
                self.stdout.write(self.style.WARNING("No users have 2FA enabled."))
                return
            for user in users:
                user.mfa_enabled = False
                user.mfa_method = ""
                user.save(update_fields=["mfa_enabled", "mfa_method"])
                TOTPDevice.objects.filter(user=user).delete()
                self.stdout.write(self.style.SUCCESS(f"2FA disabled for {user.username}."))
            return

        username = options.get("username")
        if not username:
            self.stderr.write(self.style.ERROR("Provide a username or use --all."))
            return

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"User '{username}' not found."))
            return

        if not user.mfa_enabled:
            self.stdout.write(self.style.WARNING(f"2FA is already disabled for {username}."))
            return

        user.mfa_enabled = False
        user.mfa_method = ""
        user.save(update_fields=["mfa_enabled", "mfa_method"])
        TOTPDevice.objects.filter(user=user).delete()

        self.stdout.write(self.style.SUCCESS(f"2FA disabled for {username}. You can now log in with password only."))
