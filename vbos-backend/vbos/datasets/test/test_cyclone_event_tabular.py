"""CycloneEvent linkage and validation for RAP-style tabular dataset types."""

from django.core.exceptions import ValidationError
from django.test import TestCase

from vbos.datasets.models import Cluster, CycloneEvent, TabularDataset
from vbos.rap_import.models import RAPImportBatch


class TestCycloneEventTabularValidation(TestCase):
    def setUp(self):
        self.cluster = Cluster.objects.create(name="Administrative")

    def test_baseline_allows_no_cyclone_or_batch(self):
        ds = TabularDataset(
            name="Schools",
            cluster=self.cluster,
            source="Gov",
            type="baseline",
        )
        ds.full_clean()

    def test_estimated_damage_requires_cyclone_or_batch(self):
        ds = TabularDataset(
            name="Damage",
            cluster=self.cluster,
            source="Gov",
            type="estimated_damage",
        )
        with self.assertRaises(ValidationError) as ctx:
            ds.full_clean()
        self.assertIn("cyclone_event", ctx.exception.error_dict)

    def test_trio_passes_with_cyclone_event(self):
        ev = CycloneEvent.objects.create(
            name="Cyclone Test",
            slug="test-2024",
            season_year=2024,
        )
        for t in (
            "estimated_damage",
            "aid_resources_needed",
            "estimate_financial_damage",
        ):
            with self.subTest(type=t):
                ds = TabularDataset(
                    name=f"DS {t}",
                    cluster=self.cluster,
                    source="Gov",
                    type=t,
                    cyclone_event=ev,
                )
                ds.full_clean()

    def test_trio_passes_with_rap_batch_only(self):
        batch = RAPImportBatch.objects.create(
            batch_ref="TC-TEST-2024",
            cyclone_name="Test",
            event_year=2024,
        )
        ds = TabularDataset(
            name="RAP damage",
            cluster=self.cluster,
            source="RAP",
            type="estimated_damage",
            rap_batch=batch,
        )
        ds.full_clean()
