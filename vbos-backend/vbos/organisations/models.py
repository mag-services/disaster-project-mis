"""
Ministry / partner organisations (e.g. GGGI, MoCCA, VBoS) for dataset ownership and RBAC.
"""
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _

from vbos.datasets.models import Cluster


class Organisation(models.Model):
    """
    Logical tenant for linked users and dataset ownership.
    Use slug for stable API keys; name is display-only.
    """

    name = models.CharField(max_length=255, help_text=_("Display name, e.g. Global Green Growth Institute"))
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text=_("Stable identifier, e.g. gggi, mocca, vbos"),
    )
    short_name = models.CharField(
        max_length=64,
        blank=True,
        help_text=_("Abbreviation for UI"),
    )
    is_active = models.BooleanField(default=True, db_index=True)
    notes = models.TextField(blank=True, help_text=_("Internal notes (partnership, MOU, etc.)"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = _("Organisation")
        verbose_name_plural = _("Organisations")

    def __str__(self):
        return self.name


class OrganisationClusterAccess(models.Model):
    """
    Per-organisation access to a whole cluster (all datasets in that cluster).
    If an organisation has **no** rows here, all clusters are allowed for catalogue visibility
    (subject to owning_organisation / shares). If **any** row exists, only listed clusters (with
    can_view=True) are visible unless the dataset is owned by or shared with the org.
    """

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name="cluster_access",
    )
    cluster = models.ForeignKey(Cluster, on_delete=models.CASCADE, related_name="organisation_access")
    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(
        default=False,
        help_text=_("Intended for future API/admin write paths; document in runbooks until enforced everywhere."),
    )
    can_publish = models.BooleanField(
        default=False,
        help_text=_("Allows moving datasets to Published / Archived where enforced."),
    )

    class Meta:
        unique_together = [("organisation", "cluster")]
        verbose_name = _("Organisation cluster access")
        verbose_name_plural = _("Organisation cluster access")

    def __str__(self):
        return f"{self.organisation.slug} → {self.cluster.name}"


class DatasetOrganisationShare(models.Model):
    """
    Grant an organisation access to a specific catalog row (any of the four dataset models).
    Use for cross-ministry sharing (e.g. GGGI-owned layer visible to MoCCA).
    """

    organisation = models.ForeignKey(
        Organisation,
        on_delete=models.CASCADE,
        related_name="dataset_shares",
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    can_view = models.BooleanField(default=True)
    can_edit = models.BooleanField(default=False)
    can_publish = models.BooleanField(default=False)

    class Meta:
        unique_together = [("organisation", "content_type", "object_id")]
        verbose_name = _("Dataset organisation share")
        verbose_name_plural = _("Dataset organisation shares")
        indexes = [
            models.Index(fields=["organisation", "content_type", "object_id"]),
        ]

    def __str__(self):
        return f"{self.organisation.slug} share #{self.object_id}"
