"""
Area Administrator workflow: Area admins enter data → VBoS approves → data appears in MIS.
"""
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class AreaAdministrator(models.Model):
    """
    Links a user to the area councils they can manage.
    Area admins enter data for their constituency; VBoS approves before it appears in MIS.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="area_administrator",
    )
    area_councils = models.ManyToManyField(
        "datasets.AreaCouncil",
        related_name="area_administrators",
        blank=True,
        help_text="Area councils this administrator can enter data for.",
    )
    provinces = models.ManyToManyField(
        "datasets.Province",
        related_name="area_administrators",
        blank=True,
        help_text="Provinces this administrator can enter data for (province-level only).",
    )
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Area Admin: {self.user.username}"

    class Meta:
        verbose_name = "Area Administrator"
        verbose_name_plural = "Area Administrators"


class AreaDataSubmission(models.Model):
    """
    Pending tabular data from an area administrator.
    On approval, items are promoted to TabularItem and appear in MIS.
    """
    STATUS_DRAFT = "draft"
    STATUS_SUBMITTED = "submitted"
    STATUS_APPROVED = "approved"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_DRAFT, _("Draft")),
        (STATUS_SUBMITTED, _("Pending approval")),
        (STATUS_APPROVED, _("Approved")),
        (STATUS_REJECTED, _("Rejected")),
    ]

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="area_submissions",
    )
    dataset = models.ForeignKey(
        "datasets.TabularDataset",
        on_delete=models.CASCADE,
        related_name="area_submissions",
    )
    province = models.ForeignKey(
        "datasets.Province",
        on_delete=models.PROTECT,
        related_name="area_submissions",
    )
    area_council = models.ForeignKey(
        "datasets.AreaCouncil",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="area_submissions",
        help_text="Null = province-level data.",
    )
    year = models.PositiveIntegerField()
    # Items: list of {attribute: str, value: float}
    items = models.JSONField(
        default=list,
        help_text="List of {attribute, value} pairs. Matches TabularItem structure.",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_DRAFT,
        db_index=True,
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_submissions",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        ac = self.area_council.name if self.area_council else "Province"
        return f"{self.dataset.name} / {self.province.name} / {ac} / {self.year} ({self.status})"

    class Meta:
        ordering = ["-updated"]
        verbose_name = "Area Data Submission"
        verbose_name_plural = "Area Data Submissions"
        unique_together = ["dataset", "province", "area_council", "year"]
