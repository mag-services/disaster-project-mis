from django import forms
from django.contrib import admin
from django.contrib.gis import admin as gis_admin
from unfold.admin import ModelAdmin as UnfoldModelAdmin
from django.shortcuts import redirect
from django.urls import reverse

from vbos.datasets.admin import PMTilesDatasetAdmin, VectorDatasetAdmin

from .models import LandAccountsData, LandAccountsPMTilesDataset, LandAccountsVectorDataset


class LandAccountsDataForm(forms.ModelForm):
    class Meta:
        model = LandAccountsData
        fields = ["data"]

    def clean_data(self):
        data = self.cleaned_data.get("data")
        if not isinstance(data, dict):
            raise forms.ValidationError("Data must be a JSON object.")
        if "provinces" not in data:
            raise forms.ValidationError("Data must have a 'provinces' key.")
        return data


@admin.register(LandAccountsData)
class LandAccountsDataAdmin(UnfoldModelAdmin):
    form = LandAccountsDataForm
    list_display = ["id", "updated_display", "provinces_count"]
    readonly_fields = ["updated_at"]
    ordering = ["-updated_at"]

    def updated_display(self, obj):
        return obj.updated_at.strftime("%Y-%m-%d %H:%M") if obj.updated_at else "-"

    updated_display.short_description = "Last updated"

    def provinces_count(self, obj):
        provinces = obj.data.get("provinces", {})
        return len(provinces)

    provinces_count.short_description = "Provinces"

    def changelist_view(self, request, extra_context=None):
        """Redirect to custom form-based list view."""
        return redirect("admin_land_accounts_list")

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        """Redirect to custom form-based edit view."""
        if object_id:
            return redirect("admin_land_accounts_edit", object_id=object_id)
        return redirect("admin_land_accounts_list")

    def has_add_permission(self, request):
        return True

    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(LandAccountsVectorDataset)
class LandAccountsVectorDatasetAdmin(VectorDatasetAdmin):
    change_list_template = "admin/land_accounts/landaccountsvectordataset/change_list.html"
    change_form_template = "admin/land_accounts/landaccountsvectordataset/change_form.html"
    list_display = ["id", "name", "type", "icon", "color", "updated"]
    list_editable = ["icon", "color"]

    def get_queryset(self, request):
        return LandAccountsVectorDataset.objects.all()

    def save_model(self, request, obj, form, change):
        obj.climate_module = "land_accounts"
        if not obj.cluster_id:
            from vbos.datasets.models import Cluster
            obj.cluster = Cluster.objects.get_or_create(name="Land Accounts", defaults={"order": 100})[0]
        super().save_model(request, obj, form, change)

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(super().get_fieldsets(request, obj))
        result = []
        for name, data in fieldsets:
            if name == "Section":
                continue
            if name == "Map display":
                result.append((name, {"fields": ("icon", "color"), **{k: v for k, v in data.items() if k != "fields"}}))
                continue
            if name is None:
                result.append((name, {"fields": ("name", "type", "description", "source"), **{k: v for k, v in data.items() if k != "fields"}}))
                continue
            result.append((name, data))
        return result


@admin.register(LandAccountsPMTilesDataset)
class LandAccountsPMTilesDatasetAdmin(PMTilesDatasetAdmin):
    list_display = ["id", "name", "type", "updated"]
    list_editable = []

    def get_queryset(self, request):
        return LandAccountsPMTilesDataset.objects.all()

    def save_model(self, request, obj, form, change):
        obj.climate_module = "land_accounts"
        if not obj.cluster_id:
            from vbos.datasets.models import Cluster
            obj.cluster = Cluster.objects.get_or_create(name="Land Accounts", defaults={"order": 100})[0]
        super().save_model(request, obj, form, change)

    def get_fieldsets(self, request, obj=None):
        fieldsets = list(super().get_fieldsets(request, obj))
        result = []
        for name, data in fieldsets:
            if name == "Section":
                continue
            if name is None:
                result.append((name, {"fields": ("name", "type", "description", "source"), **{k: v for k, v in data.items() if k != "fields"}}))
                continue
            result.append((name, data))
        return result
