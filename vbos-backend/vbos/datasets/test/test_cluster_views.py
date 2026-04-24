from django.urls.base import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vbos.datasets.models import Cluster


class TestClusterListView(APITestCase):
    def setUp(self):
        self.c1 = Cluster.objects.create(name="Administrative")
        self.c2 = Cluster.objects.create(name="Transportation")
        self.c3 = Cluster.objects.create(name="Other")
        self.url = reverse("datasets:cluster-list")

    def test_cluster_list_view(self):
        req = self.client.get(self.url)
        assert req.status_code == status.HTTP_200_OK
        assert req.data.get("count") == 3
        # It's ordered alphabetically by the name
        assert req.data.get("results")[0]["name"] == "Administrative"
        assert req.data.get("results")[1]["name"] == "Other"
        assert req.data.get("results")[2]["name"] == "Transportation"
        assert req.data.get("results")[0]["id"] == self.c1.id
        assert req.data.get("results")[1]["id"] == self.c3.id
        assert req.data.get("results")[2]["id"] == self.c2.id
