from django.urls.base import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vbos.datasets.models import Cluster


class TestProvinceListView(APITestCase):
    def test_cluster_list_view(self):
        self.url = reverse("datasets:province-list")
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 6
        assert req.data.get("features")[0]["properties"]["name"] == "MALAMPA"
        assert req.data.get("features")[0]["geometry"]["type"] == "MultiPolygon"
