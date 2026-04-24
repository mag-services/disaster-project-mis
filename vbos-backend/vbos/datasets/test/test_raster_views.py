from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import DatasetPublicationStatus, RasterDataset, RasterFile


class TestRasterDatasetListDetailViews(APITestCase):
    def setUp(self):
        # Rasters are Climate-mode only; cluster is optional (null)
        self.dataset_1 = RasterDataset.objects.create(
            name="Rainfall",
            description="Rainfall data since 2020",
            cluster=None,
            filename_id="rainfall",
            source="WMO",
            titiler_url_params="rescale=-0.3,0.3",
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.dataset_2 = RasterDataset.objects.create(
            name="Coastline changes",
            filename_id="population_baseline",
            source="OSM",
            cluster=None,
            type="estimated_damage",
            titiler_url_params="rescale=-0.5,0.5",
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.url = reverse("datasets:raster-list")

    def test_raster_datasets_list(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2
        assert req.data.get("results")[0]["name"] == "Rainfall"
        assert req.data.get("results")[1]["name"] == "Coastline changes"
        assert req.data.get("results")[0]["description"] == "Rainfall data since 2020"
        assert req.data.get("results")[0]["cluster"] is None
        assert req.data.get("results")[1]["cluster"] is None
        assert req.data.get("results")[0]["source"] == "WMO"
        assert req.data.get("results")[1]["source"] == "OSM"
        assert req.data.get("results")[0]["type"] == "baseline"
        assert req.data.get("results")[1]["type"] == "estimated_damage"
        assert req.data.get("results")[0]["titiler_url_params"] == "rescale=-0.3,0.3"
        assert req.data.get("results")[1]["titiler_url_params"] == "rescale=-0.5,0.5"

    def test_raster_datasets_list_filter(self):
        req = self.client.get(self.url, {"type": "baseline"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        req = self.client.get(self.url, {"type": "estimated_damage"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

    def test_raster_datasets_detail(self):
        url = reverse("datasets:raster-detail", args=[self.dataset_1.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("name") == "Rainfall"
        assert req.data.get("filename_id") == "rainfall"
        assert req.data.get("created")
        assert req.data.get("updated")
        assert req.data.get("source") == "WMO"
        assert req.data.get("cluster") is None
        assert req.data.get("description") == "Rainfall data since 2020"
        assert req.data.get("titiler_url_params") == "rescale=-0.3,0.3"
        assert req.data.get("is_land_cover") is False

    def test_raster_is_land_cover_in_response(self):
        self.dataset_1.is_land_cover = True
        self.dataset_1.save()
        url = reverse("datasets:raster-detail", args=[self.dataset_1.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("is_land_cover") is True

    def tearDown(self):
        RasterDataset.objects.all().delete()
        RasterFile.objects.all().delete()
