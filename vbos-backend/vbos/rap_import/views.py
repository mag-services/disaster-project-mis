"""Staff-only admin upload UI for RAP CSV batches (multi-file)."""

from __future__ import annotations

from django.contrib.admin.views.decorators import staff_member_required
from django.db import transaction
from django.http import JsonResponse
from django.urls import reverse
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView

from .models import RAPImportBatch, RAPImportFile
from .services import detect_sector_family, validate_rap_csv


@method_decorator(staff_member_required, name="dispatch")
class RAPUploadView(TemplateView):
    """
    Custom admin page for uploading an entire RAP export batch.
    Accepts multiple CSV files in one upload.

    For each file:
      1. Detects sector_family from filename
      2. Validates against RAP schema
      3. Creates RAPImportFile record linked to the batch
      4. Returns per-file validation summary as JSON (POST)

    URL: /admin/rap-import/upload/
    """

    template_name = "admin/rap_import/upload.html"

    def post(self, request, *args, **kwargs):
        batch_ref = request.POST.get("batch_ref", "").strip()
        cyclone_name = request.POST.get("cyclone_name", "").strip()
        event_year = request.POST.get("event_year", "")
        files = request.FILES.getlist("csv_files")

        errors: list[str] = []
        if not batch_ref:
            errors.append("batch_ref is required")
        if not cyclone_name:
            errors.append("cyclone_name is required")
        if not event_year.isdigit() or len(event_year) != 4:
            errors.append("event_year must be a 4-digit year")
        if not files:
            errors.append("At least one CSV file is required")
        if errors:
            return JsonResponse(
                {
                    "ok": False,
                    "detail": errors[0] if errors else "Validation failed",
                    "errors": {"non_field_errors": errors},
                },
                status=400,
            )

        year_int = int(event_year)

        with transaction.atomic():
            batch, created = RAPImportBatch.objects.get_or_create(
                batch_ref=batch_ref,
                defaults={
                    "cyclone_name": cyclone_name,
                    "event_year": year_int,
                    "imported_by": request.user,
                },
            )
            if not created:
                if batch.cyclone_name != cyclone_name or batch.event_year != year_int:
                    msg = (
                        "A batch with this batch_ref already exists with "
                        "different cyclone_name or event_year. Use matching "
                        "metadata or choose another batch_ref."
                    )
                    return JsonResponse(
                        {
                            "ok": False,
                            "detail": msg,
                            "errors": {"non_field_errors": [msg]},
                        },
                        status=409,
                    )

            file_results: list[dict] = []
            hazard_max: int | None = None
            provinces_set: set[str] = set()
            councils_set: set[str] = set()

            for f in files:
                family = detect_sector_family(f.name)
                if not family:
                    file_results.append(
                        {
                            "filename": f.name,
                            "sector": "unknown",
                            "valid": False,
                            "errors": ["Filename not recognised as RAP output"],
                            "warnings": [],
                            "rows": 0,
                        }
                    )
                    continue

                f.seek(0)
                validation = validate_rap_csv(f, family)
                f.seek(0)

                combined_errors = list(validation.get("errors") or [])
                combined_warnings = list(validation.get("warnings") or [])
                RAPImportFile.objects.create(
                    batch=batch,
                    sector_family=family,
                    original_filename=f.name,
                    file=f,
                    row_count=validation["row_count"],
                    columns_detected=validation["columns_detected"],
                    parse_errors=combined_errors + combined_warnings,
                    status="ok" if validation["valid"] else "error",
                )

                if family == "hazard" and validation["valid"]:
                    ir = validation.get("intensity_range")
                    if ir:
                        hi = ir[1]
                        hazard_max = hi if hazard_max is None else max(hazard_max, hi)
                    provinces_set.update(validation.get("provinces") or [])
                    councils_set.update(validation.get("councils") or [])

                file_results.append(
                    {
                        "filename": f.name,
                        "sector": family,
                        "valid": validation["valid"],
                        "rows": validation["row_count"],
                        "errors": combined_errors,
                        "warnings": combined_warnings,
                    }
                )

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

        batch_url = reverse("admin:rap_import_rapimportbatch_change", args=[batch.pk])
        return JsonResponse(
            {
                "ok": True,
                "batch_id": batch.pk,
                "batch_ref": batch_ref,
                "files": file_results,
                "batch_url": batch_url,
            }
        )
