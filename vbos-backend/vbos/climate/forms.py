"""Climate-specific forms. No cluster-related fields."""
from django import forms
from django.core.validators import RegexValidator
from django.db.models import Q

from vbos.datasets.forms import IconPickerWidget
from vbos.datasets.widgets import VectorColorPickerWidget
from vbos.datasets.models import VectorDataset


def _climate_dataset_queryset():
    """All Climate vector datasets (any display module)."""
    return VectorDataset.objects.filter(
        Q(climate_module__in=["land_accounts", "coastal_changes"])
        | ~Q(climate_modules=[])
    ).order_by("name")


class ClimateGeoJSONUploadForm(forms.Form):
    """GeoJSON import for Climate vector datasets only. No cluster info."""
    file = forms.FileField(label="File")
    dataset = forms.ModelChoiceField(
        queryset=VectorDataset.objects.none(),
        empty_label="Select a dataset",
        label="Dataset",
    )
    icon = forms.CharField(
        label="Icon to display",
        required=False,
        widget=IconPickerWidget,
        help_text="Lucide key (e.g. droplet) or Flaticon class (e.g. fi-sr-hospital). Use Browse to pick.",
    )
    color = forms.CharField(
        label="Color",
        required=False,
        widget=VectorColorPickerWidget,
        validators=[
            RegexValidator(
                regex=r"^$|^#[0-9A-Fa-f]{6}$",
                message="Use empty for auto, or a hex color like #3d4aff.",
            )
        ],
        help_text="Hex marker color or leave empty for automatic (cluster or index).",
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["dataset"].queryset = _climate_dataset_queryset()
        def _label(obj):
            mods = getattr(obj, "climate_modules", None) or []
            if not mods and getattr(obj, "climate_module", None):
                mods = [obj.climate_module]
            from .constants import CLIMATE_DISPLAY_MODULE_CHOICES
            labels = dict(CLIMATE_DISPLAY_MODULE_CHOICES)
            parts = [labels.get(m, m) for m in mods]
            return f"{obj.name}" + (f" — {', '.join(parts)}" if parts else "")
        self.fields["dataset"].label_from_instance = _label
