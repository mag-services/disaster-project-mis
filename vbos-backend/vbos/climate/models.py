"""Proxy models for Climate datasets. Shown under Climate section."""

from vbos.datasets.models import (
    PMTilesDataset,
    RasterDataset,
    RasterFile,
    VectorDataset,
    VectorItem,
)


class ClimateRasterDataset(RasterDataset):
    """Raster datasets for Climate (Land cover)."""

    class Meta:
        proxy = True
        verbose_name = "Raster dataset"
        verbose_name_plural = "Raster datasets"


class ClimateRasterFile(RasterFile):
    """Raster files for Climate."""

    class Meta:
        proxy = True
        verbose_name = "Raster file"
        verbose_name_plural = "Raster files"


class ClimatePMTilesDataset(PMTilesDataset):
    """PMTiles datasets for Climate. Display in Land cover, Coastal changes, etc."""

    class Meta:
        proxy = True
        verbose_name = "PMTiles dataset"
        verbose_name_plural = "PMTiles datasets"


class ClimateVectorDataset(VectorDataset):
    """Vector datasets for Climate. Display in Land cover, Coastal changes, etc."""

    class Meta:
        proxy = True
        verbose_name = "Vector dataset"
        verbose_name_plural = "Vector datasets"


class ClimateVectorItem(VectorItem):
    """Vector items for Climate datasets only. Shown under Climate > Vector Items."""

    class Meta:
        proxy = True
        verbose_name = "Vector item"
        verbose_name_plural = "Vector items"
