"""
Publication workflow helpers for dataset catalog APIs.

Default: only `published` datasets are visible. Staff may pass `?publication=all`
to list/retrieve unpublished datasets (draft/archived) for QA.
"""
from __future__ import annotations

from django.shortcuts import get_object_or_404

from vbos.datasets.models import DatasetPublicationStatus


def staff_sees_all_publication_statuses(request) -> bool:
    if not request.user.is_authenticated:
        return False
    if not getattr(request.user, "is_staff", False):
        return False
    pub = (request.query_params.get("publication") or "").strip().lower()
    return pub in ("all", "*", "1", "true", "yes")


def _filter_publication_only(qs, request):
    if staff_sees_all_publication_statuses(request):
        return qs
    return qs.filter(publication_status=DatasetPublicationStatus.PUBLISHED)


def filter_queryset_for_public_api(qs, request):
    """
    List/detail queryset: published only unless staff requests all;
    then optional organisation scoping (see vbos.organisations.access).
    """
    qs = _filter_publication_only(qs, request)
    model = getattr(qs, "model", None)
    if model is None:
        return qs
    from vbos.organisations.access import filter_queryset_for_organisation

    return filter_queryset_for_organisation(qs, request, model)


def get_dataset_for_read_or_404(model_class, request, pk):
    """Retrieve a dataset by pk respecting publication rules."""
    qs = filter_queryset_for_public_api(model_class.objects.all(), request)
    return get_object_or_404(qs, pk=pk)
