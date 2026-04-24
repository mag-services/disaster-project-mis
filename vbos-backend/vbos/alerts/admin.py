from django.contrib import admin
from unfold.admin import ModelAdmin

from .models import Alert, AlertSeverity, AlertType


@admin.register(Alert)
class AlertAdmin(ModelAdmin):
    list_display = [
        "title",
        "alert_type",
        "severity",
        "province",
        "is_active",
        "issued_at",
        "created_by",
    ]
    list_filter = ["alert_type", "severity", "is_active", "province"]
    search_fields = ["title", "summary"]
    ordering = ["-issued_at"]
    readonly_fields = ["source", "created_by", "created_at", "updated_at"]
    fieldsets = [
        (
            "Alert Details",
            {
                "fields": [
                    "title",
                    "summary",
                    "alert_type",
                    "severity",
                    "province",
                    "url",
                    "issued_at",
                    "is_active",
                ]
            },
        ),
        (
            "Metadata",
            {
                "fields": ["source", "created_by", "created_at", "updated_at"],
                "classes": ["collapse"],
            },
        ),
    ]

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
