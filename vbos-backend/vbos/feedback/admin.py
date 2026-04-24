from django.contrib import admin
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from .models import Feedback


@admin.register(Feedback)
class FeedbackAdmin(UnfoldModelAdmin):
    list_display = ["category", "message_preview", "user", "created_at"]
    list_filter = ["category", "created_at"]
    search_fields = ["message", "user__username", "user_email"]
    readonly_fields = ["user", "page_url", "user_agent", "created_at"]
    date_hierarchy = "created_at"

    def message_preview(self, obj):
        return (obj.message[:60] + "…") if len(obj.message) > 60 else obj.message

    message_preview.short_description = "Message"
