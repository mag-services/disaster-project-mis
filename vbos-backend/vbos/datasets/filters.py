from django_filters import (
    CharFilter,
    DateFromToRangeFilter,
    FilterSet,
    ModelChoiceFilter,
    NumberFilter,
    OrderingFilter,
)

from django.db.models import Q

from .models import (
    AreaCouncil,
    Cluster,
    CycloneEvent,
    PMTilesDataset,
    Province,
    RasterDataset,
    TabularDataset,
    TabularItem,
    VectorDataset,
    VectorItem,
)


class DatasetFilter(FilterSet):
    name = CharFilter(field_name="name", lookup_expr="icontains")
    source = CharFilter(field_name="source", lookup_expr="icontains")
    type = CharFilter(field_name="type", lookup_expr="iexact")
    publication_status = CharFilter(
        field_name="publication_status",
        lookup_expr="iexact",
        help_text="draft | published | archived (use with staff + publication=all to list non-published).",
    )
    cluster = ModelChoiceFilter(
        field_name="cluster__name",
        to_field_name="name__iexact",
        queryset=Cluster.objects.all(),
    )
    created = DateFromToRangeFilter()
    updated = DateFromToRangeFilter()
    order_by = OrderingFilter(
        fields=("name", "id", "updated", "created"),
    )


class RasterDatasetFilter(DatasetFilter):
    class Meta:
        model = RasterDataset
        fields = ["name", "source", "publication_status", "created", "updated"]


class PMTilesDatasetFilter(DatasetFilter):
    class Meta:
        model = PMTilesDataset
        fields = ["name", "source", "cluster", "publication_status", "created", "updated"]


class VectorDatasetFilter(DatasetFilter):
    class Meta:
        model = VectorDataset
        fields = ["name", "source", "cluster", "publication_status", "created", "updated"]


class TabularDatasetFilter(DatasetFilter):
    cyclone_event = ModelChoiceFilter(
        field_name="cyclone_event",
        queryset=CycloneEvent.objects.all(),
    )

    class Meta:
        model = TabularDataset
        fields = [
            "name",
            "source",
            "cluster",
            "cyclone_event",
            "publication_status",
            "created",
            "updated",
        ]


class DataItemsBaseFilter(FilterSet):
    attribute = CharFilter(lookup_expr="icontains")
    province = CharFilter(method="filter_province_multi")
    area_council = CharFilter(method="filter_area_council_multi")

    def filter_province_multi(self, queryset, name, value):
        values = self.request.query_params.getlist("province") if self.request else []
        if not values:
            return queryset
        q = Q()
        for v in values:
            q |= Q(province__name__iexact=v.strip())
        return queryset.filter(q)

    def filter_area_council_multi(self, queryset, name, value):
        values = self.request.query_params.getlist("area_council") if self.request else []
        if not values:
            return queryset
        q = Q()
        for v in values:
            q |= Q(area_council__name__iexact=v.strip())
        return queryset.filter(q)
    metadata = CharFilter(
        field_name="metadata",
        method="filter_metadata",
        help_text="""Filter by the content of the data JSONField.""",
    )

    def split_values(self, value):
        return [
            [i.strip() for i in t.split("=")]  # remove leading and ending spaces
            for t in value.split(",")
            if len(t.split("=")) == 2
        ]

    def filter_metadata(self, queryset, name, value):
        queries = self.split_values(value)

        if not queries:
            return queryset

        for key, val in queries:
            # For exact matching (current behavior)
            try:
                # Try numeric types
                if "." in val:
                    filter_value = float(val)
                else:
                    filter_value = int(val)
            except ValueError:
                # Handle booleans
                if val.lower() in ["true", "false"]:
                    filter_value = val.lower() == "true"
                else:
                    filter_value = val

            # Use exact lookup
            lookup = f"{name}__{key}"
            queryset = queryset.filter(**{lookup: filter_value})

        return queryset


class TabularItemFilter(DataItemsBaseFilter):
    date = DateFromToRangeFilter()
    value_gte = NumberFilter(field_name="value", lookup_expr="gte")
    value_lte = NumberFilter(field_name="value", lookup_expr="lte")

    class Meta:
        model = TabularItem
        fields = ["metadata", "attribute", "province", "area_council", "id", "date"]


class VectorItemFilter(DataItemsBaseFilter):
    name = CharFilter(lookup_expr="icontains")
    ref = CharFilter(lookup_expr="icontains")

    class Meta:
        model = VectorItem
        fields = [
            "metadata",
            "attribute",
            "province",
            "area_council",
            "id",
            "name",
            "ref",
        ]
