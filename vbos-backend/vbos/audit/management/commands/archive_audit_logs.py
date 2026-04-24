"""
Management command to archive audit logs older than 2 years.
Run periodically to keep database size manageable.
"""
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from ...models import AuditLog


class Command(BaseCommand):
    help = 'Archive audit logs older than 2 years'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be archived without actually deleting',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=730,  # 2 years = 730 days
            help='Archive logs older than this many days (default: 730)',
        )
    
    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days = options['days']
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Count logs to be archived
        old_logs = AuditLog.objects.filter(timestamp__lt=cutoff_date)
        count = old_logs.count()
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would archive {count} audit logs older than {days} days')
            )
            self.stdout.write(
                self.style.WARNING(f'Cutoff date: {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")}')
            )
            return
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'No audit logs older than {days} days to archive.')
            )
            return
        
        # Confirm before deletion
        confirm = input(f'Are you sure you want to delete {count} audit logs older than {days} days? (y/N): ')
        if confirm.lower() != 'y':
            self.stdout.write(self.style.WARNING('Operation cancelled.'))
            return
        
        # Delete old logs
        deleted_count, _ = old_logs.delete()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully archived {deleted_count} audit logs older than {days} days.'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(f'Logs older than {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")} have been removed.')
        )
