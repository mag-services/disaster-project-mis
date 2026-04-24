from django.urls.base import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class TestAreaCouncilListView(APITestCase):
    def test_cluster_list_view(self):
        url = reverse("datasets:area-council-list", args=["TORBA"])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 9
        assert req.data.get("features")[0]["properties"]["name"] == "East Gaua"
        assert req.data.get("features")[0]["geometry"]["type"] == "MultiPolygon"

        # get penama councils
        url = reverse("datasets:area-council-list", args=["penama"])
        req = self.client.get(url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 12
        assert (
            req.data.get("features")[0]["properties"]["name"] == "Central Pentecost 1"
        )
        assert req.data.get("features")[0]["geometry"]["type"] == "MultiPolygon"
