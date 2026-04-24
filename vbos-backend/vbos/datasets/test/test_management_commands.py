from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from ..models import TabularDataset, TabularItem


class TestImportDatasets(TestCase):
    def setUp(self):
        self.filename = "./vbos/datasets/fixtures/master-import.csv"
        self.out = StringIO()
        call_command("import_datasets", self.filename, stdout=self.out)
        call_command("import_tabular_data", self.filename, stdout=self.out)

    def test_import(self):
        self.assertEqual(TabularDataset.objects.count(), 2)
        self.assertIn(
            "2 datasets created from {}.".format(self.filename), self.out.getvalue()
        )
        self.assertEqual(
            TabularDataset.objects.get(name="Number Schools").unit, "number"
        )
        self.assertEqual(
            TabularDataset.objects.get(name="Health Facility").unit, "number"
        )
        self.assertEqual(
            TabularDataset.objects.get(name="Number Schools").source,
            "Ministry of Education and Training",
        )
        self.assertEqual(
            TabularDataset.objects.get(name="Health Facility").source,
            "Ministry of Health",
        )
        # Test TabularItem import
        self.assertEqual(TabularItem.objects.count(), 55)
        self.assertEqual(
            TabularItem.objects.filter(dataset__name="Number Schools").count(), 31
        )
        self.assertEqual(
            TabularItem.objects.filter(dataset__name="Health Facility").count(), 24
        )
        self.assertIn(
            "55 tabular items created",
            self.out.getvalue(),
        )
        self.assertEqual(
            len(
                [
                    i[1]
                    for i in TabularItem.objects.first().metadata.items()
                    if i[1] == ""
                ]
            ),
            0,
        )

        # Clean redundant entries
        call_command("clean_tabular_data", stdout=self.out)
        self.assertEqual(TabularItem.objects.count(), 30)
        self.assertEqual(
            TabularItem.objects.filter(dataset__name="Number Schools").count(), 10
        )
        self.assertEqual(
            TabularItem.objects.filter(dataset__name="Health Facility").count(), 20
        )
