"""Organisation-scoped catalog visibility (VBOS_ORGANISATION_SCOPING)."""

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from vbos.datasets.models import Cluster, DatasetPublicationStatus, TabularDataset
from vbos.organisations.models import Organisation

User = get_user_model()


class OrganisationScopingTests(APITestCase):
    def setUp(self):
        self.cluster = Cluster.objects.create(name="Test Cluster", order=0)
        self.org_gggi = Organisation.objects.create(name="GGGI", slug="gggi")
        self.org_other = Organisation.objects.create(name="Other", slug="other")

        self.ds_platform = TabularDataset.objects.create(
            name="Platform DS",
            cluster=self.cluster,
            type="baseline",
            publication_status=DatasetPublicationStatus.PUBLISHED,
            owning_organisation=None,
        )
        self.ds_owned = TabularDataset.objects.create(
            name="GGGI DS",
            cluster=self.cluster,
            type="baseline",
            publication_status=DatasetPublicationStatus.PUBLISHED,
            owning_organisation=self.org_gggi,
        )

        self.user_gggi = User.objects.create_user(
            username="gggi_user",
            password="pass12345",
            organisation=self.org_gggi,
        )
        self.user_plain = User.objects.create_user(
            username="plain_user",
            password="pass12345",
            organisation=None,
        )

    def test_scoping_off_all_published_visible(self):
        self.client.force_authenticate(user=self.user_gggi)
        url = reverse("datasets:tabular-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {row["id"] for row in resp.data["results"]}
        self.assertIn(self.ds_platform.pk, ids)
        self.assertIn(self.ds_owned.pk, ids)

    @override_settings(VBOS_ORGANISATION_SCOPING=True)
    def test_scoping_on_org_user_sees_platform_and_own(self):
        self.client.force_authenticate(user=self.user_gggi)
        url = reverse("datasets:tabular-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {row["id"] for row in resp.data["results"]}
        self.assertIn(self.ds_platform.pk, ids)
        self.assertIn(self.ds_owned.pk, ids)

    @override_settings(VBOS_ORGANISATION_SCOPING=True)
    def test_scoping_on_org_user_hides_other_org_owned(self):
        ds_other = TabularDataset.objects.create(
            name="MoCCA only",
            cluster=self.cluster,
            type="baseline",
            publication_status=DatasetPublicationStatus.PUBLISHED,
            owning_organisation=self.org_other,
        )
        self.client.force_authenticate(user=self.user_gggi)
        url = reverse("datasets:tabular-list")
        resp = self.client.get(url)
        ids = {row["id"] for row in resp.data["results"]}
        self.assertNotIn(ds_other.pk, ids)

    @override_settings(VBOS_ORGANISATION_SCOPING=True)
    def test_no_org_user_sees_full_published_catalog(self):
        self.client.force_authenticate(user=self.user_plain)
        url = reverse("datasets:tabular-list")
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        ids = {row["id"] for row in resp.data["results"]}
        self.assertIn(self.ds_platform.pk, ids)
        self.assertIn(self.ds_owned.pk, ids)
