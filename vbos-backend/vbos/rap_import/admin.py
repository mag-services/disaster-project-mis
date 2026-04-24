"""Unfold admin for RAP import batches and files."""

from __future__ import annotations

import csv
import io

from django.contrib import admin, messages
from django.utils.html import escape, format_html
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import RangeDateFilter

from .models import RAPImportBatch, RAPImportFile
from .services import validate_rap_csv


class RAPImportFileInline(TabularInline):
    model = RAPImportFile
    extra = 0
    can_delete = False
    readonly_fields = [
        "original_filename",
        "sector_family",
        "row_count",
        "columns_detected",
        "status_badge",
        "parse_errors_summary",
        "uploaded_at",
    ]
    fields = [
        "original_filename",
        "sector_family",
        "row_count",
        "columns_detected",
        "status_badge",
        "parse_errors_summary",
        "uploaded_at",
    ]

    @admin.display(description="Status")
    def status_badge(self, obj: RAPImportFile):
        styles = {
            "ok": "background:#EAF6EE;color:#27500A;border:1px solid #9FE1CB",
            "error": "background:#FEECEA;color:#A32D2D;border:1px solid #F7C1C1",
            "pending": "background:#FDF3E0;color:#633806;border:1px solid #F5C875",
        }
        s = styles.get(obj.status, styles["pending"])
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:9px;'
            "padding:2px 7px;border-radius:3px;text-transform:uppercase;"
            'letter-spacing:.04em;{}">{}</span>',
            s,
            obj.status.upper(),
        )

    @admin.display(description="Parse Errors")
    def parse_errors_summary(self, obj: RAPImportFile):
        errs = obj.parse_errors or []
        if not errs:
            return format_html('<span style="color:#27500A;font-size:11px;">None</span>')
        return format_html(
            '<span style="color:#A32D2D;font-size:11px;">{}</span>',
            "; ".join(str(e) for e in errs[:3]),
        )

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(RAPImportBatch)
class RAPImportBatchAdmin(ModelAdmin):
    compressed_fields = True
    list_filter_submit = True

    list_display = [
        "batch_ref",
        "cyclone_name",
        "event_year",
        "status_badge",
        "max_intensity_badge",
        "provinces_summary",
        "file_count",
        "imported_by",
        "imported_at_fmt",
    ]
    list_filter = [
        "status",
        "event_year",
        ("imported_at", RangeDateFilter),
    ]
    search_fields = ["batch_ref", "cyclone_name", "notes"]
    autocomplete_fields = ["cyclone_event"]
    readonly_fields = [
        "status",
        "imported_by",
        "imported_at",
        "max_intensity",
        "provinces_affected",
        "councils_affected",
        "province_intensity_panel",
    ]
    inlines = [RAPImportFileInline]

    fieldsets = (
        (
            "Batch Identity",
            {
                "fields": (
                    ("batch_ref", "cyclone_name"),
                    "cyclone_event",
                    ("event_year", "rendered_at"),
                    "status",
                ),
                "classes": ["tab"],
            },
        ),
        (
            "Impact Summary",
            {
                "fields": (
                    "max_intensity",
                    "provinces_affected",
                    "councils_affected",
                    "province_intensity_panel",
                ),
                "classes": ["tab"],
                "description": "Auto-populated after hazard CSV is parsed.",
            },
        ),
        (
            "Status & Notes",
            {
                "fields": ("notes", "imported_by", "imported_at"),
                "classes": ["tab"],
            },
        ),
    )

    actions = ["validate_all_files", "run_import", "export_summary"]

    @admin.display(description="Status")
    def status_badge(self, obj: RAPImportBatch):
        styles = {
            "complete": "background:#EAF6EE;color:#27500A;border:1px solid #9FE1CB",
            "failed": "background:#FEECEA;color:#A32D2D;border:1px solid #F7C1C1",
            "importing": "background:#EBF3FE;color:#0C447C;border:1px solid #B5D4F4",
            "pending": "background:#FDF3E0;color:#633806;border:1px solid #F5C875",
        }
        s = styles.get(obj.status, styles["pending"])
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:9px;'
            "padding:2px 7px;border-radius:3px;text-transform:uppercase;"
            'letter-spacing:.04em;{}">{}</span>',
            s,
            obj.status.upper(),
        )

    @admin.display(description="Max Cat.")
    def max_intensity_badge(self, obj: RAPImportBatch):
        if not obj.max_intensity:
            return "—"
        badge = {
            2: ("#185FA5", "#E6F1FB", "#85B7EB"),
            3: ("#633806", "#FDF3E0", "#F5C875"),
            4: ("#A32D2D", "#FEECEA", "#F7C1C1"),
            5: ("#791F1F", "#FEECEA", "#F7C1C1"),
        }
        color, bg, border = badge.get(obj.max_intensity, ("#9AA5B8", "#F8F9FB", "#E2E6EE"))
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:11px;'
            'font-weight:500;color:{};background:{};padding:2px 8px;border-radius:3px;'
            'border:1px solid {};">Cat {}</span>',
            color,
            bg,
            border,
            obj.max_intensity,
        )

    @admin.display(description="Provinces")
    def provinces_summary(self, obj: RAPImportBatch):
        provinces = obj.provinces_affected or []
        if not provinces:
            return format_html('<span style="color:#9AA5B8;">—</span>')
        shown = ", ".join(provinces[:3])
        suffix = f" +{len(provinces) - 3} more" if len(provinces) > 3 else ""
        return format_html(
            '<span style="font-size:11px;color:#9AA5B8;">{}{}</span>',
            shown,
            suffix,
        )

    @admin.display(description="Files")
    def file_count(self, obj: RAPImportBatch):
        total = obj.files.count()
        ok = obj.files.filter(status="ok").count()
        err = obj.files.filter(status="error").count()
        if err:
            return format_html(
                '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:10px;">'
                '<span style="color:#27500A">{}</span>/<span style="color:#A32D2D">{} err</span>/{}</span>',
                ok,
                err,
                total,
            )
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:10px;">'
            "{}/{}</span>",
            ok,
            total,
        )

    @admin.display(description="Province intensity (hazard CSV)")
    def province_intensity_panel(self, obj: RAPImportBatch):
        if not obj.pk:
            return "—"
        hazard_file = obj.files.filter(sector_family="hazard", status="ok").first()
        if not hazard_file:
            return format_html(
                '<span style="color:#9AA5B8;font-size:11px;">'
                "No hazard CSV imported for this batch.</span>"
            )
        try:
            hazard_file.file.seek(0)
            raw = hazard_file.file.read()
            content = raw.decode("utf-8-sig") if isinstance(raw, bytes) else raw
            reader = csv.DictReader(io.StringIO(content))
        except Exception as exc:
            return format_html(
                '<span style="color:#A32D2D;font-size:11px;">Could not read hazard file: {}</span>',
                escape(str(exc)),
            )

        intensity_colors = {"2": "#185FA5", "3": "#633806", "4": "#A32D2D", "5": "#791F1F"}
        parts = []
        for row in reader:
            province = escape((row.get("Province") or "—").strip() or "—")
            council = escape((row.get("Area Council") or "—").strip() or "—")
            intensity = (row.get("Intensity") or "").strip()
            if intensity == "0" or intensity == "":
                continue
            color = intensity_colors.get(intensity, "#9AA5B8")
            parts.append(
                "<tr>"
                f'<td style="padding:4px 8px;font-size:11px;color:#4A5568;">{province}</td>'
                f'<td style="padding:4px 8px;font-size:11px;color:#9AA5B8;">{council}</td>'
                '<td style="padding:4px 8px;font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;'
                f'font-size:11px;font-weight:500;color:{color}">Cat {escape(intensity)}</td>'
                "</tr>"
            )
        if not parts:
            return format_html(
                '<span style="color:#9AA5B8;font-size:11px;">'
                "No councils with Intensity &gt; 0.</span>"
            )

        thead = (
            "<thead><tr>"
            '<th style="padding:4px 8px;font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:9px;'
            'letter-spacing:.08em;text-transform:uppercase;color:#9AA5B8;text-align:left;">'
            "Province</th>"
            '<th style="padding:4px 8px;font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:9px;'
            'letter-spacing:.08em;text-transform:uppercase;color:#9AA5B8;text-align:left;">'
            "Area Council</th>"
            '<th style="padding:4px 8px;font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:9px;'
            'letter-spacing:.08em;text-transform:uppercase;color:#9AA5B8;text-align:left;">'
            "Intensity</th>"
            "</tr></thead>"
        )
        return mark_safe(
            '<table style="border-collapse:collapse;width:100%;max-width:720px;">'
            + thead
            + "<tbody>"
            + "".join(parts)
            + "</tbody></table>"
        )

    @admin.display(description="Imported")
    def imported_at_fmt(self, obj: RAPImportBatch):
        if not obj.imported_at:
            return "—"
        return format_html(
            '<span style="font-family:\'Segoe UI Mono\',\'Cascadia Mono\',Consolas,ui-monospace,monospace;font-size:10px;color:#9AA5B8">{}</span>',
            obj.imported_at.strftime("%d %b %Y %H:%M"),
        )

    def save_model(self, request, obj, form, change):
        if not change and obj.imported_by_id is None:
            obj.imported_by = request.user
        super().save_model(request, obj, form, change)

    @admin.action(description="Validate all uploaded files")
    def validate_all_files(self, request, queryset):
        for batch in queryset:
            hazard_max: int | None = None
            provinces_set: set[str] = set()
            councils_set: set[str] = set()
            for f in batch.files.all():
                f.file.seek(0)
                result = validate_rap_csv(f.file, f.sector_family)
                f.status = "ok" if result["valid"] else "error"
                combined = list(result.get("errors") or []) + list(result.get("warnings") or [])
                f.parse_errors = combined
                f.row_count = result["row_count"]
                f.columns_detected = result["columns_detected"]
                f.save()
                if f.sector_family == "hazard" and result.get("valid"):
                    ir = result.get("intensity_range")
                    if ir:
                        hi = ir[1]
                        hazard_max = hi if hazard_max is None else max(hazard_max, hi)
                    provinces_set.update(result.get("provinces") or [])
                    councils_set.update(result.get("councils") or [])
            if hazard_max is not None or provinces_set or councils_set:
                if hazard_max is not None:
                    batch.max_intensity = hazard_max
                batch.provinces_affected = sorted(provinces_set)
                batch.councils_affected = sorted(councils_set)
                batch.save(
                    update_fields=[
                        "max_intensity",
                        "provinces_affected",
                        "councils_affected",
                    ]
                )
        self.message_user(request, "Validation complete.", messages.SUCCESS)

    @admin.action(description="Run import into TabularDatasets")
    def run_import(self, request, queryset):
        from vbos.rap_import.services import import_rap_batch_to_tabular

        try:
            from vbos.rap_import.tasks import import_rap_batch_task
        except ImportError:
            import_rap_batch_task = None

        def _run_sync(batch: RAPImportBatch) -> None:
            for f in batch.files.filter(status="ok"):
                with f.file.open("rb") as fh:
                    import_rap_batch_to_tabular(batch, fh, sector_family=f.sector_family)
            batch.status = "complete"
            batch.save(update_fields=["status"])

        for batch in queryset.filter(status="pending"):
            batch.status = "importing"
            batch.save(update_fields=["status"])
            dispatched = False
            if import_rap_batch_task is not None:
                try:
                    import_rap_batch_task.delay(batch.pk)
                    dispatched = True
                except Exception:
                    dispatched = False
            if not dispatched:
                try:
                    _run_sync(batch)
                except NotImplementedError as exc:
                    batch.status = "failed"
                    batch.save(update_fields=["status"])
                    self.message_user(
                        request,
                        f"Import not implemented yet: {exc}",
                        level=messages.ERROR,
                    )
                    return
                except Exception as exc:
                    batch.status = "failed"
                    batch.save(update_fields=["status"])
                    self.message_user(
                        request,
                        f"Import failed: {exc}",
                        level=messages.ERROR,
                    )
                    return
        self.message_user(request, "Import queued or completed.", messages.SUCCESS)

    @admin.action(description="Export summary (selected batches)")
    def export_summary(self, request, queryset):
        n = queryset.count()
        self.message_user(
            request,
            f"Summary: {n} batch(es) selected. Full export can be wired to CSV/XLSX later.",
            messages.INFO,
        )


@admin.register(RAPImportFile)
class RAPImportFileAdmin(ModelAdmin):
    list_display = [
        "original_filename",
        "batch",
        "sector_family",
        "status",
        "row_count",
        "uploaded_at",
    ]
    list_filter = ["sector_family", "status"]
    search_fields = ["original_filename", "batch__batch_ref"]
    readonly_fields = ["uploaded_at"]
    raw_id_fields = ["batch"]
