"""
Business logic for area submissions: approval promotes data to TabularItem.
"""
from datetime import date
from django.utils import timezone

from vbos.datasets.models import TabularItem


def promote_submission_to_tabular(submission):
    """
    On approval: create/update TabularItem records from submission items.
    Replaces existing items for this dataset+province+area_council+year.
    """
    from .models import AreaDataSubmission

    if submission.status != AreaDataSubmission.STATUS_APPROVED:
        return

    # Delete existing items for this scope
    TabularItem.objects.filter(
        dataset=submission.dataset,
        province=submission.province,
        area_council=submission.area_council,
        date__year=submission.year,
    ).delete()

    # Create new items
    year_date = date(submission.year, 1, 1)
    for item in submission.items:
        attribute = (item.get("attribute") or "").strip() or None
        try:
            value = float(item.get("value", 0))
        except (TypeError, ValueError):
            value = 0
        TabularItem.objects.create(
            dataset=submission.dataset,
            province=submission.province,
            area_council=submission.area_council,
            date=year_date,
            attribute=attribute,
            value=value,
            metadata={},
        )
