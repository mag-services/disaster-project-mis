"""
Admin for Integration API keys and sources.
"""
from django.contrib import admin
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html
from .models import IntegrationAPIKey, IntegrationSource, ExternalDataSource


@admin.register(IntegrationSource)
class IntegrationSourceAdmin(UnfoldModelAdmin):
    list_display = ["name", "contact_email", "is_active", "generate_key_link", "created"]
    list_filter = ["is_active"]
    search_fields = ["name", "description"]

    def generate_key_link(self, obj):
        url = reverse("admin:integrations_integrationsource_generate_key", args=[obj.pk])
        return format_html('<a href="{}">Generate API Key</a>', url)

    generate_key_link.short_description = ""

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<int:source_id>/generate-key/",
                self.admin_site.admin_view(self.generate_key_view),
                name="integrations_integrationsource_generate_key",
            ),
        ]
        return custom + urls

    def generate_key_view(self, request, source_id):
        source = IntegrationSource.objects.filter(pk=source_id).first()
        if not source:
            from django.contrib import messages
            messages.error(request, "Integration source not found.")
            return redirect("admin:integrations_integrationsource_changelist")

        if request.method == "POST":
            name = request.POST.get("key_name") or f"{source.name} API Key"
            raw_key = IntegrationAPIKey.create_key(name=name, source=source)
            return render(
                request,
                "admin/integrations/api_key_created.html",
                {"raw_key": raw_key, "source": source, "opts": self.model._meta},
            )

        return render(
            request,
            "admin/integrations/generate_key_form.html",
            {"source": source, "opts": self.model._meta},
        )


@admin.register(IntegrationAPIKey)
class IntegrationAPIKeyAdmin(UnfoldModelAdmin):
    list_display = ["name", "source", "key_display", "is_active", "last_used", "created"]
    list_filter = ["is_active", "source"]
    search_fields = ["name"]
    readonly_fields = ["key_hash", "key_prefix", "created", "last_used"]

    def key_display(self, obj):
        return format_html("<code>{}</code>", obj.key_prefix)

    key_display.short_description = "Key"


@admin.register(ExternalDataSource)
class ExternalDataSourceAdmin(UnfoldModelAdmin):
    list_display = ["name", "target_dataset", "url_short", "auth_type", "is_active", "last_sync", "last_sync_status"]
    list_filter = ["is_active", "auth_type"]
    search_fields = ["name", "url"]
    readonly_fields = ["last_sync", "last_sync_status", "last_sync_error"]

    def url_short(self, obj):
        return obj.url[:60] + "..." if len(obj.url) > 60 else obj.url

    url_short.short_description = "URL"
