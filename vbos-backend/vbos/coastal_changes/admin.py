from django import forms
from django.contrib import admin
from django.shortcuts import redirect
from unfold.admin import ModelAdmin as UnfoldModelAdmin

from vbos.datasets.admin import PMTilesDatasetAdmin, VectorDatasetAdmin

from .models import (
    CoastalChangesData,
    CoastalChangesPMTilesDataset,
    CoastalChangesVectorDataset,
)


class CoastalChangesDataForm(forms.ModelForm):
    class Meta:
        model = CoastalChangesData
        fields = ["data"]

    def clean_data(self):
        data = self.cleaned_data.get("data")
        if not isinstance(data, dict):
            raise forms.ValidationError("Data must be a JSON object.")
        if "provinces" not in data:
            raise forms.ValidationError("Data must have a 'provinces' key.")
        return data


@admin.register(CoastalChangesData)
class CoastalChangesDataAdmin(UnfoldModelAdmin):
    form = CoastalChangesDataForm
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
        return redirect("admin_coastal_changes_list")

    def changeform_view(self, request, object_id=None, form_url="", extra_context=None):
        """Redirect to custom form-based edit view."""
        if object_id:
            return redirect("admin_coastal_changes_edit", object_id=object_id)
        return redirect("admin_coastal_changes_list")

    def has_add_permission(self, request):
        return True

    def has_delete_permission(self, request, obj=None):
        return True


@admin.register(CoastalChangesVectorDataset)
class CoastalChangesVectorDatasetAdmin(VectorDatasetAdmin):
    change_list_template = "admin/coastal_changes/coastalchangesvectordataset/change_list.html"
    change_form_template = "admin/coastal_changes/coastalchangesvectordataset/change_form.html"
    list_display = ["id", "name", "type", "icon", "color", "updated"]
    list_editable = ["icon", "color"]

    def get_queryset(self, request):
        return CoastalChangesVectorDataset.objects.all()

    def save_model(self, request, obj, form, change):
        obj.climate_module = "coastal_changes"
        if not obj.cluster_id:
            from vbos.datasets.models import Cluster
            obj.cluster = Cluster.objects.get_or_create(name="Coastal Changes", defaults={"order": 101})[0]
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


@admin.register(CoastalChangesPMTilesDataset)
class CoastalChangesPMTilesDatasetAdmin(PMTilesDatasetAdmin):
    list_display = ["id", "name", "type", "updated"]
    list_editable = []

    def get_queryset(self, request):
        return CoastalChangesPMTilesDataset.objects.all()

    def save_model(self, request, obj, form, change):
        obj.climate_module = "coastal_changes"
        if not obj.cluster_id:
            from vbos.datasets.models import Cluster
            obj.cluster = Cluster.objects.get_or_create(name="Coastal Changes", defaults={"order": 101})[0]
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
