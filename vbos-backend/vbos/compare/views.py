"""RAP batch comparison (admin)."""

from __future__ import annotations

from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views.generic import TemplateView

from vbos.rap_import.models import RAPImportBatch


def _compute_rap_batch_diff(batch_a: RAPImportBatch, batch_b: RAPImportBatch) -> dict:
    prov_a = set(batch_a.provinces_affected or [])
    prov_b = set(batch_b.provinces_affected or [])

    sectors_a = set(batch_a.files.filter(status="ok").values_list("sector_family", flat=True))
    sectors_b = set(batch_b.files.filter(status="ok").values_list("sector_family", flat=True))

    return {
        "shared_provinces": sorted(prov_a & prov_b),
        "a_only_provinces": sorted(prov_a - prov_b),
        "b_only_provinces": sorted(prov_b - prov_a),
        "intensity_a": batch_a.max_intensity,
        "intensity_b": batch_b.max_intensity,
        "intensity_delta": (batch_a.max_intensity or 0) - (batch_b.max_intensity or 0),
        "sector_coverage_a": sorted(sectors_a),
        "sector_coverage_b": sorted(sectors_b),
        "missing_in_a": sorted(sectors_b - sectors_a),
        "missing_in_b": sorted(sectors_a - sectors_b),
        "financial_delta": {},
    }


@method_decorator(staff_member_required, name="dispatch")
class EventCompareView(TemplateView):
    """Compare two completed RAP import batches (provinces, sectors, intensity)."""

    template_name = "admin/compare/event.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx.setdefault("title", "Compare RAP batches")

        ctx["available_batches"] = RAPImportBatch.objects.filter(status="complete").order_by(
            "-event_year", "cyclone_name"
        )

        batch_a_id = self.request.GET.get("batch_a")
        batch_b_id = self.request.GET.get("batch_b")
        ctx["batch_a_id"] = batch_a_id or ""
        ctx["batch_b_id"] = batch_b_id or ""
        ctx["error"] = None
        ctx["batch_a"] = None
        ctx["batch_b"] = None
        ctx["diff"] = None

        if batch_a_id and batch_b_id:
            try:
                batch_a = RAPImportBatch.objects.get(pk=batch_a_id, status="complete")
                batch_b = RAPImportBatch.objects.get(pk=batch_b_id, status="complete")
                ctx["batch_a"] = batch_a
                ctx["batch_b"] = batch_b
                ctx["diff"] = _compute_rap_batch_diff(batch_a, batch_b)
            except RAPImportBatch.DoesNotExist:
                ctx["error"] = "One or both batches were not found or are not complete yet."

        return ctx
