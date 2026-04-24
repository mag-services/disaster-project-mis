"""
List all users (username, email, staff, mfa_enabled).
Run: ./manage.py list_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "List all users (username, email, staff, mfa_enabled)."

    def handle(self, *args, **options):
        for u in User.objects.all().order_by("username"):
            mfa = "2FA" if u.mfa_enabled else ""
            staff = "staff" if u.is_staff else ""
            flags = " ".join(filter(None, [mfa, staff]))
            self.stdout.write(f"  {u.username}  {u.email or '(no email)'}  {flags}")
