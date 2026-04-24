from django.conf import settings
from django.contrib.gis.db import models
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator, RegexValidator
from django.db.models.fields.files import default_storage
from django.db.models.signals import post_delete, post_save, pre_delete
from django.dispatch import receiver
from django.utils.translation import gettext_lazy as _
from vbos.audit.signals import AuditableMixin, log_audit_action, get_field_changes

UPLOAD_TO = "staging/raster/" if settings.DEBUG else "production/raster/"

TYPE_CHOICES = {
    "baseline": _("Baseline"),
    # RAP cyclone outputs — must be linked to a CycloneEvent or RAPImportBatch.
    "estimated_damage": _("Cyclone RAP — Estimated Physical Damage"),
    "aid_resources_needed": _("Cyclone RAP — Immediate Response Resources Needed"),
    "estimate_financial_damage": _("Cyclone RAP — Estimated Financial Damage"),
}

# Cyclone RAP output types: require CycloneEvent or RAPImportBatch (see TabularDataset.clean).
# These are produced exclusively by the Quarto RAP tool for cyclone events.
RAP_EVENT_TABULAR_TYPES = frozenset(
    {"estimated_damage", "aid_resources_needed", "estimate_financial_damage"}
)


class DatasetPublicationStatus(models.TextChoices):
    """Catalog visibility: draft (internal), published (live), archived (hidden)."""

    DRAFT = "draft", _("Draft")
    PUBLISHED = "published", _("Published")
    ARCHIVED = "archived", _("Archived")


class DatasetPublicationMixin(models.Model):
    """Shared publication workflow for all dataset catalog models."""

    publication_status = models.CharField(
        max_length=20,
        choices=DatasetPublicationStatus.choices,
        default=DatasetPublicationStatus.DRAFT,
        db_index=True,
    )
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Set when publication_status is Published (audit / display)."),
    )

    class Meta:
        abstract = True


class DatasetAuthorshipMixin(models.Model):
    """Who created / last updated the dataset row (set from Django admin)."""

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    class Meta:
        abstract = True


class DatasetOwningOrganisationMixin(models.Model):
    """
    Optional owning ministry/partner (GGGI, MoCCA, etc.).
    Null means national / platform catalog visible to all orgs when scoping is enabled.
    """

    owning_organisation = models.ForeignKey(
        "organisations.Organisation",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_%(class)s",
        help_text=_("Leave empty for national platform datasets; set for partner-owned layers."),
    )

    class Meta:
        abstract = True


class DisasterDatasetTag(models.Model):
    """
    Names used to match disaster overlay layers (Cluster API cluster=disaster).
    Dataset names are matched with icontains against each tag name.
    """

    name = models.CharField(max_length=155, unique=True)
    order = models.PositiveIntegerField(default=0, db_index=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = _("Disaster dataset tag")
        verbose_name_plural = _("Disaster dataset tags")

    def __str__(self):
        return self.name


def get_disaster_dataset_tag_names():
    """Ordered tag names for disaster overlay (icontains) and exposure summaries (exact name)."""
    return list(
        DisasterDatasetTag.objects.order_by("order", "name").values_list("name", flat=True)
    )


class Cluster(models.Model):
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0, db_index=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["order"]


class CycloneEvent(models.Model):
    """
    Canonical cyclone / TC event for attributing RAP-style tabular outputs.
    Operators create an event first; estimated damage, resources, and financial damage
    datasets must reference this (or a RAP import batch) before publish-ready workflow.
    """

    name = models.CharField(
        max_length=155,
        help_text=_('Display label, e.g. "Cyclone Lola".'),
    )
    slug = models.SlugField(
        max_length=80,
        unique=True,
        help_text=_("Stable key for APIs and URLs, e.g. lola-2023."),
    )
    season_year = models.PositiveSmallIntegerField(
        help_text=_("Tropical cyclone season year (e.g. 2023)."),
    )
    started_on = models.DateField(null=True, blank=True)
    ended_on = models.DateField(null=True, blank=True)
    is_archived = models.BooleanField(default=False, db_index=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-season_year", "slug"]
        verbose_name = _("Cyclone event")
        verbose_name_plural = _("Cyclone events")

    def __str__(self):
        return f"{self.name} ({self.season_year})"


def _invalidate_cluster_cache(sender, **kwargs):
    """Clear cache so cluster list and datasets endpoints reflect admin changes."""
    cache.clear()


@receiver(post_save, sender=Cluster)
@receiver(post_delete, sender=Cluster)
def invalidate_cluster_cache(sender, **kwargs):
    _invalidate_cluster_cache(sender, **kwargs)


@receiver(post_save, sender=CycloneEvent)
@receiver(post_delete, sender=CycloneEvent)
def invalidate_cyclone_event_cache(sender, **kwargs):
    _invalidate_cluster_cache(sender, **kwargs)


# Invalidate cache when datasets change so new/updated datasets appear in frontend
@receiver(post_save, sender="datasets.VectorDataset")
@receiver(post_delete, sender="datasets.VectorDataset")
@receiver(post_save, sender="datasets.RasterDataset")
@receiver(post_delete, sender="datasets.RasterDataset")
@receiver(post_save, sender="datasets.TabularDataset")
@receiver(post_delete, sender="datasets.TabularDataset")
@receiver(post_save, sender="datasets.PMTilesDataset")
@receiver(post_delete, sender="datasets.PMTilesDataset")
def invalidate_dataset_cache(sender, **kwargs):
    _invalidate_cluster_cache(sender, **kwargs)


@receiver(post_save, sender="datasets.DisasterDatasetTag")
@receiver(post_delete, sender="datasets.DisasterDatasetTag")
def invalidate_disaster_tag_cache(sender, **kwargs):
    _invalidate_cluster_cache(sender, **kwargs)


class Province(models.Model):
    name = models.CharField(max_length=100, unique=True)
    geometry = models.GeometryField()

    def __str__(self):
        return f"{self.name}"

    class Meta:
        ordering = ["name"]


class AreaCouncil(models.Model):
    name = models.CharField(max_length=100, unique=True)
    province = models.ForeignKey(Province, null=False, on_delete=models.PROTECT)
    geometry = models.GeometryField()

    def __str__(self):
        return f"{self.name}"

    class Meta:
        ordering = ["name"]


class RasterFile(models.Model):
    name = models.CharField(max_length=155, unique=True)
    created = models.DateTimeField(auto_now_add=True)
    file = models.FileField(
        upload_to=UPLOAD_TO,
        unique=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["tiff", "tif", "geotiff", "gtiff", "vrt"]
            )
        ],
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["id"]


@receiver(pre_delete, sender=RasterFile)
def delete_raster_file(sender, instance, **kwargs):
    """
    Delete the file from storage when a RasterFile instance is deleted
    """
    if instance.file:
        # Using default_storage for better compatibility with different storage backends
        if default_storage.exists(instance.file.name):
            default_storage.delete(instance.file.name)


class RasterDataset(
    DatasetPublicationMixin,
    DatasetAuthorshipMixin,
    DatasetOwningOrganisationMixin,
    models.Model,
):
    """
    Raster datasets are Climate-mode only and are not tied to a particular cluster.
    They appear in the Land cover tab regardless of selected cluster.
    """
    name = models.CharField(max_length=155)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)
    filename_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="The filename id that will be used to compose the raster file path. The pattern will be {}/{}_{}.vrt".format(
            settings.MEDIA_URL, "{filename_id}", "{year}"
        ),
    )
    titiler_url_params = models.CharField(
        max_length=1000,
        blank=True,
        null=True,
        help_text="Additional URL params for TiTiler (e.g. rescale=0,1). For land cover, frontend adds colormap when is_land_cover is checked.",
    )
    is_land_cover = models.BooleanField(
        default=False,
        help_text="When checked, this raster is treated as categorical land cover (9 classes). Frontend auto-activates it in Climate mode and applies a discrete colormap.",
    )
    precomputed_tile_url = models.CharField(
        max_length=1024,
        blank=True,
        null=True,
        help_text="URL template for precomputed tiles. Use {z},{x},{y},{year} placeholders. Relative paths like /media/tiles/landcover/{year}/{z}/{x}/{y}.png work with Vite proxy in dev.",
    )

    def __str__(self):
        cluster_part = self.cluster.name if self.cluster else "Climate"
        return f"{self.name} - {cluster_part} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type"]


# Legacy Lucide icon keys (still supported). Flaticon format: fi-sr-{name} (e.g. fi-sr-hospital)


class VectorDataset(
    DatasetPublicationMixin,
    DatasetAuthorshipMixin,
    DatasetOwningOrganisationMixin,
    models.Model,
):
    name = models.CharField(max_length=155, unique=False)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)
    icon = models.CharField(
        max_length=80,
        blank=True,
        null=True,
        help_text="Icon to display on the map. Use Lucide key (e.g. droplet) or Flaticon class (e.g. fi-sr-hospital). Leave empty for auto.",
    )
    color = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        validators=[
            RegexValidator(
                regex=r"^$|^#[0-9A-Fa-f]{6}$",
                message="Use empty for auto, or a hex color like #3d4aff.",
            )
        ],
        help_text="Hex color for map markers (e.g. #3d4aff). Leave empty for auto (cluster or index).",
    )
    cyclone_name = models.CharField(
        max_length=155,
        blank=True,
        null=True,
        help_text="Name of the cyclone/event (e.g. Cyclone Lola). Shown when layer is active.",
    )
    climate_module = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        choices=[
            ("", "Disaster only"),
            ("land_accounts", "Land Accounts (Climate)"),
            ("coastal_changes", "Coastal Changes (Climate)"),
        ],
        help_text="Deprecated: use climate_modules. Kept for backward compatibility.",
    )
    climate_modules = models.JSONField(
        default=list,
        blank=True,
        help_text="Modules where this dataset is shown: Land cover, Coastal changes, Flood, etc. Empty = Disaster only.",
    )
    popup_properties = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            "Optional ordered list of property keys (as in map GeoJSON features) to show in the live map popup. "
            "Examples: name, attribute, province, or keys from imported metadata such as "
            '"Industry size". Leave empty to show every property.'
        ),
    )

    def __str__(self):
        return f"{self.name} - {self.cluster} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type", "cluster"]

    def clean(self):
        super().clean()
        pp = self.popup_properties
        if pp is None:
            return
        if not isinstance(pp, list):
            raise ValidationError(
                {"popup_properties": "Must be a JSON array of strings (property keys)."}
            )
        for i, item in enumerate(pp):
            if not isinstance(item, str):
                raise ValidationError(
                    {
                        "popup_properties": f"Entry {i + 1} must be a string (property key), not {type(item).__name__}."
                    }
                )


class PMTilesDataset(
    DatasetPublicationMixin,
    DatasetAuthorshipMixin,
    DatasetOwningOrganisationMixin,
    models.Model,
):
    name = models.CharField(max_length=155, unique=False)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)
    url = models.CharField(max_length=1550)
    source_layer = models.CharField(max_length=155)
    cyclone_name = models.CharField(
        max_length=155,
        blank=True,
        null=True,
        help_text="Name of the cyclone/event (e.g. Cyclone Lola). Shown when layer is active.",
    )
    intensity_data = models.JSONField(
        blank=True,
        default=list,
        help_text="Optional. For cyclone datasets: list of {acname, Province, Intensity, intensity_color}. Enables right-panel intensity display for PMTiles.",
    )
    climate_module = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        choices=[
            ("", "Disaster only"),
            ("land_accounts", "Land Accounts (Climate)"),
            ("coastal_changes", "Coastal Changes (Climate)"),
        ],
        help_text="Deprecated: use climate_modules. Kept for backward compatibility.",
    )
    climate_modules = models.JSONField(
        default=list,
        blank=True,
        help_text="Modules where this dataset is shown: Land cover, Coastal changes, Flood, etc. Empty = Disaster only.",
    )

    def __str__(self):
        return f"{self.name} - {self.cluster} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type", "cluster"]
        verbose_name = "PMTiles Dataset"


class VectorItem(AuditableMixin, models.Model):
    dataset = models.ForeignKey(VectorDataset, on_delete=models.CASCADE)
    name = models.CharField(max_length=155, blank=True, null=True)
    ref = models.CharField(max_length=50, blank=True, null=True)
    attribute = models.CharField(max_length=155, blank=True, null=True)
    province = models.ForeignKey(Province, null=True, on_delete=models.PROTECT)
    area_council = models.ForeignKey(AreaCouncil, null=True, on_delete=models.PROTECT)
    geometry = models.GeometryField()
    metadata = models.JSONField(default=dict, blank=True, null=True)

    def __str__(self):
        if self.name:
            return f"{self.id} ({self.name})"
        else:
            return f"{self.id}"

    class Meta:
        ordering = ["id"]


class TabularDataset(
    DatasetPublicationMixin,
    DatasetAuthorshipMixin,
    DatasetOwningOrganisationMixin,
    models.Model,
):
    name = models.CharField(max_length=155, unique=False)
    description = models.TextField(max_length=2000, null=True, blank=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    cluster = models.ForeignKey(
        Cluster,
        on_delete=models.PROTECT,
    )
    type = models.CharField(max_length=55, choices=TYPE_CHOICES, default="baseline")
    source = models.CharField(max_length=155, blank=True, null=True)
    unit = models.CharField(max_length=50, blank=True, null=True)
    # RAP (disaster-project-rap) provenance — set when data is imported from a RAP batch
    rap_batch = models.ForeignKey(
        "rap_import.RAPImportBatch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="tabular_datasets",
    )
    rap_sector_family = models.CharField(
        max_length=30,
        blank=True,
        null=True,
        help_text="RAP sector_family when sourced from RAP CSV (education, hazard, …).",
    )
    cyclone_event = models.ForeignKey(
        CycloneEvent,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="tabular_datasets",
        help_text=_(
            "Required for the three Cyclone RAP output types (estimated damage, "
            "resources needed, financial damage), unless a RAP import batch is linked. "
            "Create the cyclone event first under Cyclone events."
        ),
    )

    def __str__(self):
        return f"{self.name} - {self.cluster} / {self.type}"

    class Meta:
        ordering = ["id"]
        unique_together = ["name", "type", "cluster"]

    def clean(self):
        super().clean()
        if self.type in RAP_EVENT_TABULAR_TYPES:
            if not self.cyclone_event_id and not self.rap_batch_id:
                raise ValidationError(
                    {
                        "cyclone_event": _(
                            "Cyclone RAP output datasets (estimated damage, resources needed, "
                            "financial damage) must be linked to a cyclone event "
                            "or to a RAP import batch. "
                            "These types are only produced by the cyclone RAP tool."
                        ),
                    }
                )


class TabularItem(AuditableMixin, models.Model):
    dataset = models.ForeignKey(TabularDataset, on_delete=models.CASCADE)
    date = models.DateField(null=True)
    attribute = models.CharField(max_length=155, blank=True, null=True)
    value = models.FloatField(default=0)
    province = models.ForeignKey(Province, null=True, on_delete=models.PROTECT)
    area_council = models.ForeignKey(AreaCouncil, null=True, on_delete=models.PROTECT)
    metadata = models.JSONField(default=dict)
    # Cyclone category from RAP Intensity column (2–5), when applicable
    intensity = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.id}"

    class Meta:
        ordering = ["id"]
        indexes = [
            models.Index(fields=["dataset", "province", "area_council"]),
        ]


class MapSavedWorkspace(models.Model):
    """User-saved Live Map layout (layers, filters, camera) — JSON payload from frontend."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="map_saved_workspaces",
    )
    name = models.CharField(max_length=120)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["user", "updated_at"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.user_id})"
