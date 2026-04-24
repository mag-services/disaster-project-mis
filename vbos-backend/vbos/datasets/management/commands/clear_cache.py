from django.core.cache import cache
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Clear the Django cache. Use after admin changes (e.g. cluster add/delete) that are not reflected in the API."

    def handle(self, *args, **options):
        cache.clear()
        self.stdout.write(self.style.SUCCESS("Cache cleared successfully."))
        self.stdout.write(
            "If using gunicorn with multiple workers and LocMemCache, also run: "
            "docker-compose restart web"
        )
