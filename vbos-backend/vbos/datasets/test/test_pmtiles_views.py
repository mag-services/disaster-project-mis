from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import Cluster, DatasetPublicationStatus, PMTilesDataset


class TestPMTilesDatasetListDetailViews(APITestCase):
    def setUp(self):
        self.dataset_1 = PMTilesDataset.objects.create(
            name="Coastlines",
            description="Coastlines data since 2020",
            cluster=Cluster.objects.create(name="Environment"),
            source="WMO",
            source_layer="data",
            url="https://s3.us-west-2.amazonaws.com/dep-public-data/dep_ls_coastlines/dep_ls_coastlines_0-7-0-55.pmtiles",
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.dataset_2 = PMTilesDataset.objects.create(
            name="Population",
            source="WPO",
            cluster=Cluster.objects.create(name="Administrative"),
            type="estimated_damage",
            source_layer="data",
            url="https://s3.us-west-2.amazonaws.com/pop/population.pmtiles",
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.url = reverse("datasets:pmtiles-list")

    def test_pmtiles_datasets_list(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2
        assert req.data.get("results")[0]["name"] == "Coastlines"
        assert req.data.get("results")[1]["name"] == "Population"
        assert req.data.get("results")[0]["description"] == "Coastlines data since 2020"
        assert req.data.get("results")[0]["cluster"] == "Environment"
        assert req.data.get("results")[1]["cluster"] == "Administrative"
        assert req.data.get("results")[0]["source"] == "WMO"
        assert req.data.get("results")[1]["source"] == "WPO"
        assert req.data.get("results")[0]["source_layer"] == "data"
        assert req.data.get("results")[1]["source_layer"] == "data"
        assert req.data.get("results")[0]["type"] == "baseline"
        assert req.data.get("results")[1]["type"] == "estimated_damage"
        assert (
            req.data.get("results")[0]["url"]
            == "https://s3.us-west-2.amazonaws.com/dep-public-data/dep_ls_coastlines/dep_ls_coastlines_0-7-0-55.pmtiles"
        )
        assert (
            req.data.get("results")[1]["url"]
            == "https://s3.us-west-2.amazonaws.com/pop/population.pmtiles"
        )

    def test_pmtiles_datasets_list_filter(self):
        req = self.client.get(self.url, {"cluster": "transportation"})
        assert req.status_code == status.HTTP_400_BAD_REQUEST

        req = self.client.get(self.url, {"cluster": "administrative"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        req = self.client.get(self.url, {"cluster": "environment"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        req = self.client.get(self.url, {"type": "baseline"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

    def test_pmtiles_datasets_detail(self):
        url = reverse("datasets:pmtiles-detail", args=[self.dataset_1.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("name") == "Coastlines"
        assert req.data.get("created")
        assert req.data.get("updated")
        assert req.data.get("source") == "WMO"
        assert req.data.get("source_layer") == "data"
        assert req.data.get("cluster") == "Environment"
        assert req.data.get("description") == "Coastlines data since 2020"
        assert (
            req.data.get("url")
            == "https://s3.us-west-2.amazonaws.com/dep-public-data/dep_ls_coastlines/dep_ls_coastlines_0-7-0-55.pmtiles"
        )
