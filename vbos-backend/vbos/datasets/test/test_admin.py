import io
from datetime import date

from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from django.urls import reverse

from vbos.datasets.models import (
    Cluster,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
)


class TabularItemAdminImportFileTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = get_user_model().objects.create_superuser(
            username="admin", password="password", email="admin@example.com"
        )
        self.client.login(username="admin", password="password")
        self.cluster = Cluster.objects.create(name="Other")
        self.dataset = TabularDataset.objects.create(
            name="Test Dataset", cluster=self.cluster
        )
        self.upload_url = reverse("admin:datasets_tabularitem_import_file")

    def test_change_list_has_link_to_import_file(self):
        response = self.client.get(reverse("admin:datasets_tabularitem_changelist"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Import File")

    def test_get_import_file_view(self):
        response = self.client.get(self.upload_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Import CSV File")
        self.assertContains(response, "Import File")
        self.assertContains(response, "Dataset")
        self.assertContains(response, "Test Dataset")

    def test_post_invalid_file_type(self):
        file_data = io.BytesIO(b"not a csv")
        file_data.name = "test.txt"
        response = self.client.post(
            self.upload_url,
            {"file": file_data, "dataset": self.dataset.id},
            follow=True,
        )
        self.assertContains(response, "Please upload a CSV file")

    def test_post_valid_csv_creates_items(self):
        csv_path = "./vbos/datasets/fixtures/test.csv"
        with open(csv_path, "rb") as file_data:
            response = self.client.post(
                self.upload_url,
                {"file": file_data, "dataset": self.dataset.id},
                follow=True,
            )
        self.assertContains(response, "Successfully created 3 new records")
        self.assertEqual(TabularItem.objects.count(), 3)
        ti_1, ti_2, ti_3 = TabularItem.objects.all()
        self.assertEqual(ti_1.dataset.id, self.dataset.id)
        self.assertEqual(ti_1.date, date(2024, 1, 1))
        self.assertEqual(ti_1.attribute, "ecce")
        self.assertEqual(ti_1.province.name, "TAFEA")
        self.assertEqual(ti_1.area_council.name, "Futuna")
        self.assertEqual(ti_1.value, 1154)
        self.assertEqual(ti_1.metadata["Other"], "yes")
        self.assertEqual(ti_2.dataset.id, self.dataset.id)
        self.assertEqual(ti_2.date, date(2022, 5, 1))
        self.assertEqual(ti_2.attribute, "secondary")
        self.assertEqual(ti_2.province.name, "TAFEA")
        self.assertEqual(ti_2.area_council.name, "Futuna")
        self.assertEqual(ti_2.value, 1154)
        self.assertEqual(ti_2.metadata["Other"], "no")
        self.assertEqual(ti_3.dataset.id, self.dataset.id)
        self.assertEqual(ti_3.date, date(2025, 1, 1))
        self.assertEqual(ti_3.attribute, "primary")
        self.assertEqual(ti_3.province, None)
        self.assertEqual(ti_3.area_council, None)
        self.assertEqual(ti_3.value, 1154)


class VectorItemAdminImportFileTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.admin_user = get_user_model().objects.create_superuser(
            username="admin", password="password", email="admin@example.com"
        )
        self.client.login(username="admin", password="password")
        self.cluster = Cluster.objects.create(name="Other")
        self.dataset = VectorDataset.objects.create(
            name="Test Dataset", cluster=self.cluster
        )
        self.upload_url = reverse("admin:datasets_vectoritem_import_file")

    def test_change_list_has_link_to_import_file(self):
        response = self.client.get(reverse("admin:datasets_vectoritem_changelist"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Import File")

    def test_get_import_file_view(self):
        response = self.client.get(self.upload_url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Import GeoJSON")
        self.assertContains(response, "Vector Dataset")
        self.assertContains(response, "Test Dataset")

    def test_post_invalid_file_type(self):
        file_data = io.BytesIO(b"not a geojson")
        file_data.name = "test.txt"
        response = self.client.post(
            self.upload_url,
            {"file": file_data, "dataset": self.dataset.id},
            follow=True,
        )
        self.assertContains(response, "Please upload a GeoJSON file")

    def test_post_valid_geojson_creates_items(self):
        geojson_path = "./vbos/datasets/fixtures/test.geojson"
        with open(geojson_path, "rb") as file_data:
            response = self.client.post(
                self.upload_url,
                {"file": file_data, "dataset": self.dataset.id},
                follow=True,
            )
        self.assertContains(response, "Successfully created 4 new records")
        self.assertEqual(VectorItem.objects.count(), 4)
        vi_1, vi_2, vi_3, vi_4 = VectorItem.objects.all()
        self.assertEqual(vi_1.dataset.id, self.dataset.id)
        self.assertEqual(vi_1.name, "Area 1")
        self.assertEqual(vi_1.ref, "12NC")
        self.assertEqual(vi_1.attribute, "Schools")
        self.assertEqual(vi_1.province.name, "TORBA")
        self.assertEqual(vi_1.area_council.name, "East Gaua")
        self.assertFalse("PID" in vi_1.metadata.keys())
        self.assertFalse("part" in vi_1.metadata.keys())
        self.assertFalse("key" in vi_1.metadata.keys())
        self.assertFalse("key_2" in vi_1.metadata.keys())
        self.assertTrue("extra" in vi_1.metadata.keys())
        self.assertEqual(vi_2.dataset.id, self.dataset.id)
        self.assertEqual(vi_2.name, "Line 1")
        self.assertEqual(vi_2.ref, "13NC")
        self.assertEqual(vi_2.attribute, "Roads")
        self.assertEqual(vi_2.province.name, "TAFEA")
        self.assertEqual(vi_2.area_council.name, "Futuna")
        self.assertEqual(vi_3.dataset.id, self.dataset.id)
        self.assertEqual(vi_3.name, "Point 2")
        self.assertEqual(vi_3.ref, "14NC")
        self.assertEqual(vi_3.attribute, "Business")
        self.assertEqual(vi_3.province.name, "TAFEA")
        self.assertEqual(vi_3.area_council.name, "Futuna")
        self.assertEqual(vi_3.metadata["source"], "OpenStreetMap")
        self.assertEqual(vi_4.ref, "199163611")
        self.assertIsNone(vi_4.province)
        self.assertIsNone(vi_4.area_council)
