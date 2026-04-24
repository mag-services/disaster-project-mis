"""Custom widgets for icon/color selection with visual previews."""
import json

from django import forms
from django.utils.html import escape
from django.utils.safestring import mark_safe

from .templatetags.vector_icons import ICON_SVGS

# Quick presets next to the native color input (hex must match map marker expectations)
VECTOR_COLOR_PRESETS = [
    ("#3d4aff", "Blue"),
    ("#10b981", "Emerald"),
    ("#f09000", "Orange"),
    ("#8b5cf6", "Violet"),
    ("#e34a33", "Red"),
    ("#06b6d4", "Cyan"),
    ("#6366f1", "Indigo"),
    ("#14b8a6", "Teal"),
]

_DEFAULT_FALLBACK_HEX = "#3d4aff"


class IconGridWidget(forms.Widget):
    """Renders icon options as a grid with actual icon previews."""

    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = ""
        choices = getattr(self, "choices", None) or []
        output = ['<div class="vbos-icon-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:10px;margin:8px 0;">']
        for opt_value, label in choices:
            checked = ' checked' if str(opt_value) == str(value) else ''
            svg_html = ""
            if opt_value:
                path = ICON_SVGS.get(opt_value)
                if path:
                    colored = path.replace("currentColor", "#3d4aff")
                    svg_html = f'<svg viewBox="0 0 24 24" width="28" height="28">{colored}</svg>'
            else:
                svg_html = '<span style="font-size:11px;color:#888;">Auto</span>'
            output.append(
                f'<label class="vbos-icon-option" style="display:flex;flex-direction:column;align-items:center;padding:10px;'
                f'border:2px solid #e0e0e0;border-radius:8px;cursor:pointer;background:#fff;">'
                f'<input type="radio" name="{name}" value="{opt_value}"{checked} style="margin-bottom:6px;">'
                f'<span style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;">{svg_html}</span>'
                f'<span style="font-size:11px;text-align:center;">{label}</span></label>'
            )
        output.append("</div>")
        return mark_safe("".join(output))

    def value_from_datadict(self, data, files, name):
        return data.get(name)


class ColorGridWidget(forms.Widget):
    """Renders color options as a grid with color swatches."""

    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = ""
        choices = getattr(self, "choices", None) or []
        output = ['<div class="vbos-color-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin:8px 0;">']
        for opt_value, label in choices:
            checked = ' checked' if str(opt_value) == str(value) else ''
            if opt_value:
                swatch = f'<span style="width:24px;height:24px;border-radius:4px;background:{opt_value};border:1px solid #ccc;"></span>'
            else:
                swatch = '<span style="width:24px;height:24px;border-radius:4px;background:linear-gradient(135deg,#888 50%,#ccc 50%);"></span>'
            output.append(
                f'<label class="vbos-color-option" style="display:flex;align-items:center;gap:8px;padding:8px 12px;'
                f'border:2px solid #e0e0e0;border-radius:8px;cursor:pointer;background:#fff;">'
                f'<input type="radio" name="{name}" value="{opt_value}"{checked}>'
                f'{swatch}<span style="font-size:12px;">{label}</span></label>'
            )
        output.append("</div>")
        return mark_safe("".join(output))

    def value_from_datadict(self, data, files, name):
        return data.get(name)


class VectorColorPickerWidget(forms.Widget):
    """
    Native <input type="color"> + hex text field + presets + Auto (empty).
    """

    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = ""
        value = str(value).strip()
        attrs = attrs.copy() if attrs else {}
        wid = attrs.get("id", f"id_{name}")
        display_hex = (
            value if value.startswith("#") and len(value) == 7 else _DEFAULT_FALLBACK_HEX
        )

        presets_html = []
        for hex_code, label in VECTOR_COLOR_PRESETS:
            hex_esc = escape(hex_code)
            lbl_esc = escape(label)
            presets_html.append(
                f'<button type="button" class="button vbos-color-preset" data-hex="{hex_esc}" '
                f'title="{lbl_esc}" style="width:28px;height:28px;padding:0;border-radius:4px;'
                f'background:{hex_esc};border:1px solid #ccc;cursor:pointer;"></button>'
            )

        hex_input = (
            f'<input type="text" name="{escape(name)}" id="{escape(wid)}" value="{escape(value)}" '
            f'maxlength="7" placeholder="Auto" class="vbos-vector-color-hex" '
            'pattern="^#([0-9A-Fa-f]{6})$|^$" '
            'style="width:8rem;font-family:monospace,Consolas,sans-serif;">'
        )

        native = (
            f'<input type="color" id="{escape(wid)}_native" value="{escape(display_hex)}" '
            'title="Color picker" aria-label="Pick marker color" '
            'style="width:44px;height:32px;padding:0;border:1px solid #ccc;border-radius:4px;cursor:pointer;">'
        )

        clear_btn = (
            f'<button type="button" class="button vbos-color-clear" id="{escape(wid)}_clear" '
            'style="margin-left:4px;">Auto</button>'
        )

        wid_js = json.dumps(wid)
        wid_native_js = json.dumps(f"{wid}_native")
        wid_clear_js = json.dumps(f"{wid}_clear")
        fallback_js = json.dumps(_DEFAULT_FALLBACK_HEX)

        script = f"""
<script>
(function() {{
  var hex = document.getElementById({wid_js});
  var native = document.getElementById({wid_native_js});
  var root = hex && hex.closest(".vbos-vector-color-widget");
  if (!hex || !native || !root) return;
  function syncNativeFromHex() {{
    var v = (hex.value || "").trim();
    if (/^#[0-9A-Fa-f]{{6}}$/.test(v)) native.value = v.toLowerCase();
  }}
  function syncHexFromNative() {{
    hex.value = (native.value || "").toLowerCase();
  }}
  native.addEventListener("input", syncHexFromNative);
  hex.addEventListener("input", syncNativeFromHex);
  root.querySelectorAll(".vbos-color-preset").forEach(function(btn) {{
    btn.addEventListener("click", function() {{
      hex.value = (btn.getAttribute("data-hex") || "").toLowerCase();
      syncNativeFromHex();
    }});
  }});
  var clr = document.getElementById({wid_clear_js});
  if (clr) clr.addEventListener("click", function() {{
    hex.value = "";
    native.value = {fallback_js};
  }});
  syncNativeFromHex();
}})();
</script>"""

        inner = (
            '<div class="vbos-vector-color-widget" style="margin:8px 0;">'
            '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-bottom:8px;">'
            f"{native}{hex_input}{clear_btn}"
            "</div>"
            '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;">'
            '<span style="font-size:11px;color:#666;margin-right:4px;">Presets:</span>'
            f'{"".join(presets_html)}'
            "</div></div>"
            f"{script}"
        )
        return mark_safe(inner)

    def value_from_datadict(self, data, files, name):
        v = data.get(name, "")
        if v is None:
            return ""
        return str(v).strip()


class SortableCheckboxSelectMultiple(forms.CheckboxSelectMultiple):
    """
    Checkbox list where rows can be drag-reordered (SortableJS).
    POST sends checked values in document order so popup_properties order matches the UI.
    """

    class Media:
        js = (
            "datasets/admin/Sortable.min.js",
            "datasets/admin/popup_properties_sortable.js",
        )

    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = []
        elif not isinstance(value, (list, tuple)):
            value = [value]
        selected = {str(v) for v in value}
        attrs = attrs.copy() if attrs else {}
        attrs.setdefault("class", "")
        if "vbos-sortable-checkboxes" not in attrs["class"]:
            attrs["class"] = (attrs["class"] + " vbos-sortable-checkboxes").strip()
        final_attrs = self.build_attrs(attrs)
        wid = final_attrs.get("id") or f"id_{name}"

        rows = []
        idx = 0
        for opt_value, opt_label in self.choices:
            if opt_value == "":
                continue
            cb_id = f"{wid}_{idx}"
            idx += 1
            v_esc = escape(str(opt_value))
            lbl_esc = escape(str(opt_label))
            chk = " checked" if str(opt_value) in selected else ""
            rows.append(
                f'<li class="vbos-popup-prop-item">'
                f'<span class="vbos-popup-prop-handle" role="button" tabindex="0" '
                f'title="Drag to reorder" aria-label="Drag to reorder">⋮⋮</span>'
                f'<label class="vbos-popup-prop-label">'
                f'<input type="checkbox" name="{escape(name)}" id="{cb_id}" '
                f'value="{v_esc}"{chk}>'
                f"<span>{lbl_esc}</span>"
                f"</label></li>"
            )

        style = (
            "<style>"
            ".vbos-popup-prop-sortable-root{margin:8px 0;max-width:42rem;}"
            ".vbos-popup-prop-sortable{list-style:none;margin:0;padding:0;}"
            ".vbos-popup-prop-item{display:flex;align-items:center;gap:6px;padding:6px 8px;"
            "border-bottom:1px solid rgba(128,128,128,.2);background:var(--body-bg, #fff);}"
            ".vbos-popup-prop-handle{cursor:grab;color:#888;font-size:12px;line-height:1;"
            "padding:4px 6px;user-select:none;letter-spacing:-2px;flex-shrink:0;}"
            ".vbos-popup-prop-handle:active{cursor:grabbing;}"
            ".vbos-popup-prop-label{display:flex;align-items:center;gap:10px;margin:0;"
            "cursor:pointer;flex:1;min-width:0;}"
            ".vbos-popup-prop-ghost{opacity:.55;background:rgba(59,130,246,.12)!important;}"
            ".vbos-popup-prop-chosen{opacity:.95;}"
            "</style>"
        )
        ul = (
            f'<div class="vbos-popup-prop-sortable-root">'
            f'<ul class="vbos-popup-prop-sortable" id="{escape(wid)}_sortlist">'
            f'{"".join(rows)}</ul></div>'
        )
        return mark_safe(f"{style}{ul}")
