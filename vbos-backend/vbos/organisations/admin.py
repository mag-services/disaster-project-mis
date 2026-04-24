from django.contrib import admin
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from vbos.organisations.models import (
    DatasetOrganisationShare,
    Organisation,
    OrganisationClusterAccess,
)


class OrganisationClusterAccessInline(admin.TabularInline):
    model = OrganisationClusterAccess
    extra = 0
    autocomplete_fields = ("cluster",)


@admin.register(Organisation)
class OrganisationAdmin(UnfoldModelAdmin):
    list_display = ["name", "slug", "short_name", "is_active", "updated_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug", "short_name"]
    prepopulated_fields = {"slug": ("name",)}
    inlines = [OrganisationClusterAccessInline]


@admin.register(OrganisationClusterAccess)
class OrganisationClusterAccessAdmin(UnfoldModelAdmin):
    list_display = ["organisation", "cluster", "can_view", "can_edit", "can_publish"]
    list_filter = ["can_view", "can_edit", "can_publish"]
    autocomplete_fields = ("organisation", "cluster")


@admin.register(DatasetOrganisationShare)
class DatasetOrganisationShareAdmin(UnfoldModelAdmin):
    list_display = ["organisation", "content_type", "object_id", "can_view", "can_edit", "can_publish"]
    list_filter = ["can_view", "can_edit", "can_publish", "content_type"]
    autocomplete_fields = ("organisation",)
