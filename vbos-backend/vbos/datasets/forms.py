from __future__ import annotations

from django import forms
from django.core.validators import RegexValidator
from django.forms import formset_factory
from django.urls import reverse
from django.utils.safestring import mark_safe

from .models import TabularDataset, VectorDataset, VectorItem
from .widgets import SortableCheckboxSelectMultiple, VectorColorPickerWidget


class IconPickerWidget(forms.TextInput):
    """Text input with Browse button that opens Flaticon icon picker."""

    def render(self, name, value, attrs=None, renderer=None):
        attrs = attrs or {}
        attrs.setdefault("placeholder", "e.g. fi-sr-hospital or droplet")
        html = super().render(name, value, attrs, renderer)
        picker_url = reverse("admin_icon_picker")
        html += mark_safe(
            f' <a href="{picker_url}" id="icon-browse-btn" target="_blank" '
            'rel="noopener" onclick="event.preventDefault();'
            f'window.open(this.href,\'iconpicker\',\'width=600,height=500\');'
            'return false;" class="button">Browse icons</a>'
        )
        return html


class FileDatasetRowForm(forms.Form):
    """Single row for file-dataset mapping (Option 3)."""

    file = forms.FileField(
        label="File",
        required=False,
        help_text="Leave empty to skip this row",
    )
    dataset = forms.ModelChoiceField(
        queryset=TabularDataset.objects.all(),
        empty_label="Select a dataset",
        required=False,
    )


FileDatasetFormSet = formset_factory(
    FileDatasetRowForm,
    extra=1,
    min_num=1,
    validate_min=True,
)


class CSVImportOptionsForm(forms.Form):
    """Global options for CSV import (applies to all files in the formset)."""

    format_style = forms.ChoiceField(
        label="CSV format",
        choices=[
            ("long", "Long format (Year, Attribute, Value per row)"),
            ("wide", "Wide format (Region per row, metrics as columns)"),
        ],
        initial="long",
        help_text="Wide format: first column = Region, other columns = attribute names with values",
    )
    year = forms.IntegerField(
        label="Year (for wide format)",
        required=False,
        min_value=1900,
        max_value=2100,
        initial=2024,
        help_text="Used when CSV has no Year column (wide format)",
    )


class CSVUploadForm(forms.Form):
    file = forms.FileField(label="File")
    dataset = forms.ModelChoiceField(
        queryset=TabularDataset.objects.all(),
        empty_label="Select a dataset",
    )
    format_style = forms.ChoiceField(
        label="CSV format",
        choices=[
            ("long", "Long format (Year, Attribute, Value per row)"),
            ("wide", "Wide format (Region per row, metrics as columns)"),
        ],
        initial="long",
        help_text="Wide format: first column = Region, other columns = attribute names with values",
    )
    year = forms.IntegerField(
        label="Year (for wide format)",
        required=False,
        min_value=1900,
        max_value=2100,
        initial=2024,
        help_text="Used when CSV has no Year column (wide format)",
    )


# GeoJSON / API property keys (VectorItemSerializer + merged metadata). Order = map popup order when filtered.
STANDARD_VECTOR_POPUP_KEYS = ("name", "attribute", "province", "area_council")
_VECTOR_POPUP_SKIP_KEYS = frozenset({"id", "metadata"})


def discover_vector_popup_property_choices(
    dataset: VectorDataset,
    *,
    saved_keys: list | None = None,
    max_items: int = 3000,
) -> list[tuple[str, str]]:
    """
    Build (value, label) choices for the map-popup multiselect.
    Scans up to `max_items` items for metadata keys; always offers standard columns.
    """
    saved_keys = list(saved_keys or [])
    meta_keys: set[str] = set()
    if dataset.pk:
        for meta in VectorItem.objects.filter(dataset_id=dataset.pk).values_list(
            "metadata", flat=True
        )[:max_items]:
            if isinstance(meta, dict):
                meta_keys.update(str(k) for k in meta.keys())
    core = [k for k in STANDARD_VECTOR_POPUP_KEYS if k not in _VECTOR_POPUP_SKIP_KEYS]
    extras = sorted(meta_keys - set(core) - _VECTOR_POPUP_SKIP_KEYS)
    orphan_saved = [
        k
        for k in saved_keys
        if k not in core and k not in extras and k not in _VECTOR_POPUP_SKIP_KEYS
    ]
    ordered = core + extras + orphan_saved
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    for k in ordered:
        if k in seen:
            continue
        seen.add(k)
        out.append((k, k))
    return out


def order_popup_choices_by_saved(
    choices: list[tuple[str, str]], saved: list[str]
) -> list[tuple[str, str]]:
    """Put keys from saved (in saved order) first, then any remaining choices."""
    cmap = dict(choices)
    out: list[tuple[str, str]] = []
    seen: set[str] = set()
    for k in saved:
        if k in cmap and k not in seen:
            out.append((k, cmap[k]))
            seen.add(k)
    for k, lbl in choices:
        if k not in seen:
            out.append((k, lbl))
            seen.add(k)
    return out


class VectorDatasetAdminForm(forms.ModelForm):
    """Admin form: map popup uses checkboxes instead of raw JSON for popup_properties."""

    popup_property_keys = forms.MultipleChoiceField(
        label="Map popup properties",
        required=False,
        widget=SortableCheckboxSelectMultiple,
        help_text=(
            "Leave all unchecked to show every property on the live map. "
            "Tick fields to include; drag ⋮⋮ to set the order shown in the map popup."
        ),
    )

    class Meta:
        model = VectorDataset
        fields = "__all__"
        exclude = ("popup_properties",)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        inst = self.instance
        saved = list(inst.popup_properties or []) if getattr(inst, "pk", None) else []
        choices = discover_vector_popup_property_choices(inst, saved_keys=saved)
        self.fields["popup_property_keys"].choices = order_popup_choices_by_saved(
            choices, saved
        )
        if saved:
            self.initial["popup_property_keys"] = saved

    def save(self, commit=True):
        obj = super().save(commit=False)
        obj.popup_properties = list(self.cleaned_data.get("popup_property_keys") or [])
        if commit:
            obj.save()
            self.save_m2m()
        return obj


class GeoJSONUploadForm(forms.Form):
    file = forms.FileField(label="File")
    dataset = forms.ModelChoiceField(
        queryset=VectorDataset.objects.all(), empty_label="Select a dataset"
    )
    icon = forms.CharField(
        label="Icon to display",
        required=False,
        widget=IconPickerWidget,
        help_text="Lucide key (e.g. droplet) or Flaticon class (e.g. fi-sr-hospital). Use Browse to pick from 50,000+ icons.",
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
