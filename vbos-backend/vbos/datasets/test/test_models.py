from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db.utils import IntegrityError
from django.test import TestCase

from vbos.datasets.models import (
    Cluster,
    RasterDataset,
    RasterFile,
    TabularDataset,
    VectorDataset,
)


class TestRasterModels(TestCase):
    def setUp(self):
        self.valid_file = SimpleUploadedFile(
            "rainfall.tiff", b"file_content", content_type="image/tiff"
        )
        self.r_1 = RasterFile.objects.create(name="Rainfall COG", file=self.valid_file)
        self.r_2 = RasterFile.objects.create(
            name="Coastline COG", file="raster/coastline.tiff"
        )
        self.dataset = RasterDataset.objects.create(
            name="Rainfall",
            cluster=None,
            filename_id="rainfall",
        )

    def test_deletion(self):
        # name should be unique
        raster = RasterFile(name="Rainfall COG 2", file="raster/coastline.tiff")
        with self.assertRaises(ValidationError):
            raster.full_clean()

        # file path should be unique
        raster = RasterFile(name="Rainfall COG", file="newfile.tif")
        with self.assertRaises(ValidationError):
            raster.full_clean()

        # delete file
        self.r_1.delete()
        self.assertEqual(RasterFile.objects.count(), 1)
        # delete remaining file
        self.r_2.delete()
        self.assertEqual(RasterFile.objects.count(), 0)

        # test file extension validation
        invalid_file = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg"
        )
        raster = RasterFile(name="Test", file=invalid_file)
        with self.assertRaises(ValidationError):
            raster.full_clean()

        RasterFile.objects.all().delete()

    def test_unique_name_type(self):
        """Raster (name, type) is unique globally; cluster is optional."""
        r_2 = RasterFile.objects.create(
            name="Population Density COG", file="raster/pop.tiff"
        )
        RasterDataset.objects.create(
            name="Population",
            cluster=None,
            source="Government",
            filename_id="population_baseline",
            titiler_url_params="rescale=-0.3,0.3",
        )
        RasterDataset.objects.create(
            name="Population",
            cluster=None,
            source="Government",
            filename_id="population_damage",
            type="estimated_damage",
        )
        with self.assertRaises(IntegrityError):
            RasterDataset.objects.create(
                name="Population",
                cluster=None,
                source="Government",
                filename_id="population_baseline_dup",
            )


class TestTabularDatasetModel(TestCase):
    def test_unique_name_type_cluster(self):
        self.cluster = Cluster.objects.create(name="Administrative")
        TabularDataset.objects.create(
            name="Population",
            cluster=self.cluster,
            source="Government",
        )
        TabularDataset.objects.create(
            name="Population",
            cluster=self.cluster,
            source="Government",
            type="estimated_damage",
        )
        TabularDataset.objects.create(
            name="Population",
            cluster=Cluster.objects.create(name="education"),
            source="Government",
            type="estimated_damage",
        )
        with self.assertRaises(IntegrityError):
            TabularDataset.objects.create(
                name="Population",
                cluster=self.cluster,
                source="Government",
            )


class TestVectorDatasetModel(TestCase):
    def test_unique_name_type_cluster(self):
        self.cluster = Cluster.objects.create(name="Administrative")
        VectorDataset.objects.create(
            name="Population",
            cluster=self.cluster,
            source="Government",
        )
        VectorDataset.objects.create(
            name="Population",
            cluster=self.cluster,
            source="Government",
            type="estimated_damage",
        )
        VectorDataset.objects.create(
            name="Population",
            cluster=Cluster.objects.create(name="education"),
            source="Government",
            type="estimated_damage",
        )
        with self.assertRaises(IntegrityError):
            VectorDataset.objects.create(
                name="Population",
                cluster=self.cluster,
                source="Government",
            )
