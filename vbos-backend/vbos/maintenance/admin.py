"""
Register LogEntry (admin changelog) and BackupLog for viewing in admin.
"""
from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.utils.html import format_html
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from .models import BackupLog


@admin.register(BackupLog)
class BackupLogAdmin(UnfoldModelAdmin):
    """Read-only admin for backup history."""

    list_display = ["created_at", "backup_type", "get_size_display", "filename", "created_by"]
    list_filter = ["backup_type"]
    search_fields = ["filename"]
    readonly_fields = ["created_at", "backup_type", "size_bytes", "filename", "included_categories", "created_by", "file_path"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]

    def get_size_display(self, obj):
        return obj.size_display

    get_size_display.short_description = "Size"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(LogEntry)
class LogEntryAdmin(UnfoldModelAdmin):
    """Read-only admin for Django admin action log (changelog)."""

    list_display = ["action_time", "user", "content_type", "object_repr", "action_flag_display", "get_change_message"]
    list_filter = ["action_flag", "content_type", "user"]
    search_fields = ["object_repr", "change_message", "user__username"]
    date_hierarchy = "action_time"
    ordering = ["-action_time"]
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def action_flag_display(self, obj):
        from django.contrib.admin.models import ADDITION, CHANGE, DELETION

        if obj.action_flag == ADDITION:
            return format_html(
                '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;'
                'color:#27500A;background:#EAF6EE;padding:2px 6px;border-radius:3px;'
                'border:1px solid #9FE1CB;">Added</span>'
            )
        if obj.action_flag == CHANGE:
            return format_html(
                '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;'
                'color:#0C447C;background:#EBF3FE;padding:2px 6px;border-radius:3px;'
                'border:1px solid #B5D4F4;">Changed</span>'
            )
        if obj.action_flag == DELETION:
            return format_html(
                '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;'
                'color:#A32D2D;background:#FEECEA;padding:2px 6px;border-radius:3px;'
                'border:1px solid #F7C1C1;">Deleted</span>'
            )
        return str(obj.get_action_flag_display())

    action_flag_display.short_description = "Action"

    def get_change_message(self, obj):
        try:
            return obj.get_change_message()
        except Exception:
            return obj.change_message or ""

    get_change_message.short_description = "Changes"
