"""
Coastal changes data: shoreline change by province and year.
Stored as JSON to support flexible metrics (erosion, accretion, net change).
"""
from django.db import models

from vbos.datasets.models import PMTilesDataset, VectorDataset


class CoastalChangesData(models.Model):
    """
    Single-row store for coastal changes. Data structure:
    {
      "provinces": {
        "Torba": { "2020": 0, "2021": 0, ... },  # shoreline change in meters
        ...
      }
    }
    """
    title = models.CharField(
        max_length=100,
        default="",
        blank=True,
        help_text="e.g. 2020–2023, or a short description of this coastal change period.",
    )
    data = models.JSONField(
        default=dict,
        help_text="Coastal changes by province and year. Keys: provinces (object).",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Coastal Changes Data"
        verbose_name_plural = "Coastal Changes Data"

    def __str__(self):
        if self.title:
            return f"{self.title} (updated {self.updated_at.date()})"
        return f"Coastal Changes (updated {self.updated_at.date()})"


class CoastalChangesVectorManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(climate_module="coastal_changes")


class CoastalChangesPMTilesManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(climate_module="coastal_changes")


class CoastalChangesVectorDataset(VectorDataset):
    """Proxy for VectorDataset with climate_module=coastal_changes. Shown under Climate > Coastal Changes."""
    objects = CoastalChangesVectorManager()

    class Meta:
        proxy = True
        verbose_name = "Coastal Changes Vector"
        verbose_name_plural = "Coastal Changes Vector"


class CoastalChangesPMTilesDataset(PMTilesDataset):
    """Proxy for PMTilesDataset with climate_module=coastal_changes. Shown under Climate > Coastal Changes."""
    objects = CoastalChangesPMTilesManager()

    class Meta:
        proxy = True
        verbose_name = "Coastal Changes PMTiles"
        verbose_name_plural = "Coastal Changes PMTiles"
