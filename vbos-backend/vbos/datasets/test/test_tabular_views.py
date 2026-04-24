from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ...users.test.factories import UserFactory
from ..models import (
    AreaCouncil,
    Cluster,
    DatasetPublicationStatus,
    Province,
    TabularDataset,
    TabularItem,
)


class TestTabularDatasetListDetailViews(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.dataset_1 = TabularDataset.objects.create(
            name="Population",
            cluster=Cluster.objects.create(name="Administrative"),
            source="Government",
            description="Population statistics since 2020",
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.dataset_2 = TabularDataset.objects.create(
            name="Prices",
            cluster=Cluster.objects.create(name="Statistics"),
            source="Government",
            type="estimated_damage",
            unit="Vatu (VUV)",
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.url = reverse("datasets:tabular-list")

    def test_tabular_datasets_list(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2
        assert req.data.get("results")[0]["name"] == "Population"
        assert req.data.get("results")[1]["name"] == "Prices"
        assert req.data.get("results")[0]["source"] == "Government"
        assert req.data.get("results")[1]["source"] == "Government"
        assert req.data.get("results")[0]["cluster"] == "Administrative"
        assert req.data.get("results")[1]["cluster"] == "Statistics"
        assert req.data.get("results")[0]["type"] == "baseline"
        assert req.data.get("results")[1]["type"] == "estimated_damage"
        assert (
            req.data.get("results")[0]["description"]
            == "Population statistics since 2020"
        )
        assert req.data.get("results")[1]["unit"] == "Vatu (VUV)"

    def test_raster_datasets_list_filter(self):
        req = self.client.get(self.url, {"cluster": "transportation"})
        assert req.status_code == status.HTTP_400_BAD_REQUEST

        req = self.client.get(self.url, {"cluster": "administrative"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        req = self.client.get(self.url, {"cluster": "statistics"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

    def test_tabular_datasets_detail(self):
        url = reverse("datasets:tabular-detail", args=[self.dataset_1.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("name") == "Population"
        assert req.data.get("created")
        assert req.data.get("updated")


class TestTabularDatasetDataView(APITestCase):
    def setUp(self):
        self.cluster = Cluster.objects.create(name="Other")
        self.user = UserFactory()
        self.dataset_1 = TabularDataset.objects.create(
            name="Population",
            cluster=self.cluster,
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.dataset_2 = TabularDataset.objects.create(
            name="Employment",
            cluster=self.cluster,
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.item = TabularItem.objects.create(
            dataset=self.dataset_1,
            date=date(2025, 1, 1),
            province=Province.objects.get(name="TORBA"),
            attribute="Population",
            value=float("13874"),
        )
        TabularItem.objects.create(
            dataset=self.dataset_1,
            date=date(2025, 1, 1),
            province=Province.objects.get(name="TAFEA"),
            attribute="Population",
            value=1230,
        )
        TabularItem.objects.create(
            dataset=self.dataset_1,
            date=date(2025, 1, 1),
            province=Province.objects.get(name="PENAMA"),
            area_council=AreaCouncil.objects.get(name="North Maewo"),
            attribute="Population",
            value=5682,
        )
        TabularItem.objects.create(
            dataset=self.dataset_2,
            date=date(2025, 1, 1),
            attribute="Employed Population",
            value=0.93,
            province=Province.objects.get(name="TORBA"),
            area_council=AreaCouncil.objects.get(name="East Gaua"),
            metadata={"additional_value": "test"},
        )
        TabularItem.objects.create(
            dataset=self.dataset_2,
            date=date(2025, 2, 1),
            attribute="Employed Population",
            value=0.9,
            province=Province.objects.get(name="TORBA"),
            area_council=AreaCouncil.objects.get(name="East Gaua"),
        )
        TabularItem.objects.create(
            dataset=self.dataset_2,
            date=date(2025, 3, 1),
            attribute="Employed Population",
            value=0.91,
            province=Province.objects.get(name="TORBA"),
            area_council=AreaCouncil.objects.get(name="East Gaua"),
        )
        TabularItem.objects.create(
            dataset=self.dataset_2,
            date=date(2025, 4, 1),
            attribute="Employed Population",
            value=0.95,
            province=Province.objects.get(name="TORBA"),
            area_council=AreaCouncil.objects.get(name="East Gaua"),
        )
        TabularItem.objects.create(
            dataset=self.dataset_2,
            value=0.87,
        )
        self.url = reverse("datasets:tabular-data", args=[self.dataset_1.id])

    def test_tabular_datasets_data(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 3
        assert len(req.data.get("results")) == 3
        assert req.data.get("results")[0]["province"] == "TORBA"
        assert req.data.get("results")[0]["value"] == 13874
        assert req.data.get("results")[0]["date"] == "2025-01-01"
        assert req.data.get("results")[0]["attribute"] == "Population"
        assert req.data.get("results")[2]["province"] == "PENAMA"
        assert req.data.get("results")[2]["area_council"] == "North Maewo"
        assert req.data.get("results")[2]["value"] == 5682
        assert req.data.get("results")[2]["date"] == "2025-01-01"
        assert req.data.get("results")[2]["attribute"] == "Population"

        # fetch second dataset's data
        url = reverse("datasets:tabular-data", args=[self.dataset_2.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 5
        assert len(req.data.get("results")) == 5
        assert req.data.get("results")[0]["province"] == "TORBA"
        assert req.data.get("results")[0]["area_council"] == "East Gaua"
        assert req.data.get("results")[0]["value"] == 0.93
        assert req.data.get("results")[0]["date"] == "2025-01-01"
        assert req.data.get("results")[0]["attribute"] == "Employed Population"
        assert req.data.get("results")[0]["additional_value"] == "test"

    def test_filter_data(self):
        url = reverse("datasets:tabular-data", args=[self.dataset_2.id])
        req = self.client.get(url, {"date_after": "2025-01-01"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 4

        req = self.client.get(url, {"date_after": "2025-03-01"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2

        req = self.client.get(url, {"date_before": "2024-12-01"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 0

        req = self.client.get(url, {"province": "torba"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 4

        req = self.client.get(url, {"province": "south"})
        assert req.status_code == status.HTTP_400_BAD_REQUEST

        req = self.client.get(url, {"area_council": "North Maewo"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 0

        req = self.client.get(url, {"area_council": "East Gaua"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 4

        req = self.client.get(url, {"attribute": "population"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 4

    def test_xlsx_format(self):
        url = reverse("datasets:tabular-data-xlsx", args=[self.dataset_1.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert (
            req.headers["Content-Type"]
            == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=utf-8"
        )
        assert req.headers[
            "content-disposition"
        ] == "attachment; filename=vbos-mis-tabular-{}.xlsx".format(self.dataset_1.id)


class TestTabularAggregateView(APITestCase):
    def setUp(self):
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        self.cluster = Cluster.objects.create(name="Demographics")
        self.dataset = TabularDataset.objects.create(
            name="Population",
            cluster=self.cluster,
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.torba = Province.objects.get(name="TORBA")
        self.tafea = Province.objects.get(name="TAFEA")
        TabularItem.objects.create(
            dataset=self.dataset,
            date=date(2025, 1, 1),
            province=self.torba,
            attribute="Population",
            value=1000.0,
        )
        TabularItem.objects.create(
            dataset=self.dataset,
            date=date(2025, 1, 1),
            province=self.torba,
            attribute="Population",
            value=500.0,
        )
        TabularItem.objects.create(
            dataset=self.dataset,
            date=date(2025, 1, 1),
            province=self.tafea,
            attribute="Population",
            value=2000.0,
        )
        TabularItem.objects.create(
            dataset=self.dataset,
            date=date(2024, 6, 1),
            province=self.torba,
            attribute="Population",
            value=800.0,
        )
        self.url = reverse("datasets:tabular-aggregate", args=[self.dataset.id])

    def test_aggregate_by_province(self):
        req = self.client.get(self.url, {"group_by": "province"})
        assert req.status_code == 200
        assert req.data["group_by"] == "province"
        results = {r["province"]: r["value"] for r in req.data["results"]}
        assert results["TORBA"] == 2300.0  # 1000 + 500 + 800 (all years)
        assert results["TAFEA"] == 2000.0

    def test_aggregate_by_province_with_year(self):
        req = self.client.get(
            self.url, {"group_by": "province", "year": "2025"}
        )
        assert req.status_code == 200
        results = {r["province"]: r["value"] for r in req.data["results"]}
        assert results["TORBA"] == 1500.0  # 2025 only: 1000 + 500
        assert results["TAFEA"] == 2000.0

    def test_aggregate_requires_group_by_valid(self):
        req = self.client.get(self.url, {"group_by": "invalid"})
        assert req.status_code == 400

    def test_aggregate_404_for_unknown_dataset(self):
        req = self.client.get(
            reverse("datasets:tabular-aggregate", args=[99999]),
            {"group_by": "province"},
        )
        assert req.status_code == 404

    def test_aggregate_by_area_council_requires_province(self):
        req = self.client.get(self.url, {"group_by": "area_council"})
        assert req.status_code == 400
