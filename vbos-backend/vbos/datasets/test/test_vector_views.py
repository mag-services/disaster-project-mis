from django.contrib.gis.geos import LineString, Point, Polygon
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from ..models import (
    AreaCouncil,
    Cluster,
    DatasetPublicationStatus,
    Province,
    VectorDataset,
    VectorItem,
)


class TestVectorDatasetListDetailViews(APITestCase):
    def setUp(self):
        self.dataset_1 = VectorDataset.objects.create(
            name="Boundaries",
            cluster=Cluster.objects.create(name="Administrative"),
            source="OSM",
            description="Administratives Boundaries",
        )
        self.dataset_2 = VectorDataset.objects.create(
            name="Roads",
            cluster=Cluster.objects.create(name="Transportation"),
            type="estimated_damage",
        )
        self.url = reverse("datasets:vector-list")

    def test_vector_datasets_list(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2
        assert req.data.get("results")[0]["name"] == "Boundaries"
        assert req.data.get("results")[1]["name"] == "Roads"
        assert req.data.get("results")[0]["description"] == "Administratives Boundaries"
        assert req.data.get("results")[0]["type"] == "baseline"
        assert req.data.get("results")[1]["type"] == "estimated_damage"
        assert req.data.get("results")[0]["popup_properties"] == []

    def test_vector_dataset_popup_properties_serialized(self):
        self.dataset_1.popup_properties = ["name", "attribute", "Industry size"]
        self.dataset_1.save(update_fields=["popup_properties"])
        req = self.client.get(reverse("datasets:vector-detail", args=[self.dataset_1.id]))
        assert req.status_code == status.HTTP_200_OK
        assert req.data["popup_properties"] == ["name", "attribute", "Industry size"]

    def test_vector_datasets_list_filter(self):
        req = self.client.get(self.url, {"cluster": "transportation"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        req = self.client.get(self.url, {"cluster": "administrative"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

    def test_vector_datasets_detail(self):
        url = reverse("datasets:vector-detail", args=[self.dataset_1.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("name") == "Boundaries"
        assert req.data.get("description") == "Administratives Boundaries"
        assert req.data.get("created")
        assert req.data.get("updated")
        assert req.data.get("cluster") == "Administrative"
        assert req.data.get("source") == "OSM"


class TestVectorDatasetDataView(APITestCase):
    def setUp(self):
        self.dataset_1 = VectorDataset.objects.create(
            name="Boundaries",
            cluster=Cluster.objects.create(name="Administrative"),
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        self.dataset_2 = VectorDataset.objects.create(
            name="Roads",
            cluster=Cluster.objects.create(name="Transportation"),
            publication_status=DatasetPublicationStatus.PUBLISHED,
        )
        VectorItem.objects.create(
            dataset=self.dataset_1,
            geometry=Point(80.5, 10.232),
            name="Point 1",
            ref="12NC",
            attribute="administrative",
            province=Province.objects.get(name="TORBA"),
            area_council=AreaCouncil.objects.get(name="East Gaua"),
            metadata={"area": 5000},
        )
        VectorItem.objects.create(
            dataset=self.dataset_1,
            geometry=LineString([(0, 0), (0, 3), (3, 3), (3, 0), (6, 6), (0, 0)]),
            name="Line 1",
            ref="13NC",
            attribute="administrative",
            province=Province.objects.get(name="TAFEA"),
            area_council=AreaCouncil.objects.get(name="Futuna"),
            metadata={"area": 5321},
        )
        VectorItem.objects.create(
            dataset=self.dataset_2,
            geometry=Polygon([(0, 0), (0, 3), (3, 3), (3, 0), (0, 0)]),
            name="Area 1",
            ref="14NC",
            attribute="business",
            province=Province.objects.get(name="TAFEA"),
            area_council=AreaCouncil.objects.get(name="Futuna"),
            metadata={"key": "value"},
        )
        VectorItem.objects.create(
            dataset=self.dataset_2,
            geometry=Polygon([(0, 0), (0, 3), (3, 3), (3, 0), (0, 0)]),
        )
        self.url = reverse("datasets:vector-data", args=[self.dataset_1.id])

    def test_vector_datasets_data(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2
        assert len(req.data.get("features")) == 2
        assert req.data.get("features")[0]["geometry"] == {
            "type": "Point",
            "coordinates": [80.5, 10.232],
        }
        assert req.data.get("features")[0]["properties"]["name"] == "Point 1"
        assert (
            req.data.get("features")[0]["properties"]["attribute"] == "administrative"
        )
        assert req.data.get("features")[0]["properties"]["province"] == "TORBA"
        assert req.data.get("features")[0]["properties"]["area_council"] == "East Gaua"
        assert req.data.get("features")[0]["properties"]["ref"] == "12NC"
        assert req.data.get("features")[0]["properties"]["metadata"]["area"] == 5000

        # fetch second dataset's data
        url = reverse("datasets:vector-data", args=[self.dataset_2.id])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2
        assert len(req.data.get("features")) == 2
        assert req.data.get("features")[0]["geometry"] == {
            "type": "Polygon",
            "coordinates": [
                [[0.0, 0.0], [0.0, 3.0], [3.0, 3.0], [3.0, 0.0], [0.0, 0.0]]
            ],
        }

    def test_filters(self):
        req = self.client.get(self.url, {"in_bbox": "80,10,81,11"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1
        assert len(req.data.get("features")) == 1
        assert req.data.get("features")[0]["geometry"] == {
            "type": "Point",
            "coordinates": [80.5, 10.232],
        }
        assert req.data.get("features")[0]["properties"]["name"] == "Point 1"

        # filter by name
        req = self.client.get(self.url, {"name": "Point"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        # filter by attribute
        req = self.client.get(self.url, {"attribute": "ADMINISTRATIVE"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2

        # filter by province
        req = self.client.get(self.url, {"province": "tafea"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        # filter by area council
        req = self.client.get(self.url, {"area_council": "East Gaua"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1

        # filter by metadata
        req = self.client.get(self.url, {"metadata": "area__lt=5000"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 0

        req = self.client.get(self.url, {"metadata": "area__gte=5000"})
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 2

        req = self.client.get(
            self.url, {"metadata": "area__gte=5000", "in_bbox": "80,10,81,11"}
        )
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 1
