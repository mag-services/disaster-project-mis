from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

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


def _owning_organisation_representation(obj):
    o = getattr(obj, "owning_organisation", None)
    if o is None:
        return None
    return {"id": o.pk, "slug": o.slug, "name": o.name, "short_name": o.short_name or None}


class ClusterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cluster
        fields = ["id", "name"]


class CycloneEventSerializer(serializers.ModelSerializer):
    """Lightweight event list used by the layer browser Risk sources tab."""

    class Meta:
        model = CycloneEvent
        fields = ["id", "name", "slug", "season_year", "is_archived", "started_on", "ended_on"]


class ProvinceSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = Province
        geo_field = "geometry"
        fields = "__all__"


class AreaCouncilSerializer(GeoFeatureModelSerializer):
    class Meta:
        model = AreaCouncil
        geo_field = "geometry"
        fields = "__all__"


class RasterDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.SerializerMethodField()
    owning_organisation = serializers.SerializerMethodField()
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    def get_cluster(self, obj):
        return obj.cluster.name if obj.cluster else None

    def get_owning_organisation(self, obj):
        return _owning_organisation_representation(obj)

    class Meta:
        model = RasterDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "filename_id",
            "titiler_url_params",
            "is_land_cover",
            "precomputed_tile_url",
            "owning_organisation",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class VectorDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")
    owning_organisation = serializers.SerializerMethodField()
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    def get_owning_organisation(self, obj):
        return _owning_organisation_representation(obj)

    class Meta:
        model = VectorDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "icon",
            "color",
            "cyclone_name",
            "climate_module",
            "climate_modules",
            "popup_properties",
            "owning_organisation",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class PMTilesDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")
    owning_organisation = serializers.SerializerMethodField()
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    def get_owning_organisation(self, obj):
        return _owning_organisation_representation(obj)

    class Meta:
        model = PMTilesDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "url",
            "source_layer",
            "cyclone_name",
            "climate_module",
            "climate_modules",
            "owning_organisation",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class VectorItemSerializer(GeoFeatureModelSerializer):
    province = serializers.CharField(
        source="province.name", read_only=True, allow_null=True
    )
    area_council = serializers.CharField(
        source="area_council.name", read_only=True, allow_null=True
    )

    class Meta:
        model = VectorItem
        geo_field = "geometry"
        id_field = "id"
        fields = [
            "id",
            "name",
            "attribute",
            "province",
            "area_council",
        ]

    def to_representation(self, instance):
        """Ensure id in properties; merge metadata (Intensity, intensity_color, etc.) for map styling."""
        data = super().to_representation(instance)
        if "properties" in data and "id" not in data.get("properties", {}):
            data["properties"]["id"] = instance.id
        if "id" not in data:
            data["id"] = instance.id
        if instance.metadata:
            data["properties"].update(instance.metadata)
        return data


class CycloneEventMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = CycloneEvent
        fields = ("id", "name", "slug", "season_year")


class TabularDatasetSerializer(serializers.ModelSerializer):
    cluster = serializers.ReadOnlyField(source="cluster.name")
    cyclone_event = CycloneEventMiniSerializer(read_only=True, allow_null=True)
    owning_organisation = serializers.SerializerMethodField()
    created_by_id = serializers.IntegerField(read_only=True, allow_null=True)
    updated_by_id = serializers.IntegerField(read_only=True, allow_null=True)

    def get_owning_organisation(self, obj):
        return _owning_organisation_representation(obj)

    class Meta:
        model = TabularDataset
        fields = [
            "id",
            "name",
            "description",
            "created",
            "updated",
            "cluster",
            "type",
            "source",
            "unit",
            "cyclone_event",
            "owning_organisation",
            "publication_status",
            "published_at",
            "published_by_id",
            "created_by_id",
            "updated_by_id",
        ]


class TabularItemSerializer(serializers.ModelSerializer):
    province = serializers.ReadOnlyField(source="province.name")
    area_council = serializers.ReadOnlyField(source="area_council.name")

    class Meta:
        model = TabularItem
        fields = [
            "id",
            "attribute",
            "date",
            "value",
            "province",
            "area_council",
            "metadata",
        ]

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        # Extract the data field and merge it with the top level fields
        data_content = representation.pop("metadata", {})

        return {**representation, **data_content}


class TabularItemExcelSerializer(serializers.ModelSerializer):
    province = serializers.ReadOnlyField(source="province.name")
    area_council = serializers.ReadOnlyField(source="area_council.name")

    # Dynamically add fields based on all possible keys in the data
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Get all possible keys from the queryset
        if self.context.get("view"):
            queryset = self.context["view"].get_queryset()
            all_keys = set()
            for item in queryset:
                if item.metadata and isinstance(item.metadata, dict):
                    all_keys.update(item.metadata.keys())

            # Create a field for each key
            for key in all_keys:
                self.fields[key] = serializers.CharField(
                    source=f"metadata.{key}",
                    required=False,
                    allow_blank=True,
                    default="",
                )

    class Meta:
        model = TabularItem
        fields = [
            "id",
            "attribute",
            "date",
            "value",
            "province",
            "area_council",
        ]
