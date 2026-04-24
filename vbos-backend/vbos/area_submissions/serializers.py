from rest_framework import serializers

from .models import AreaDataSubmission


class AreaDataSubmissionSerializer(serializers.ModelSerializer):
    dataset_name = serializers.CharField(source="dataset.name", read_only=True)
    province_name = serializers.CharField(source="province.name", read_only=True)
    area_council_name = serializers.CharField(
        source="area_council.name", read_only=True, allow_null=True
    )
    submitted_by_username = serializers.CharField(
        source="submitted_by.username", read_only=True
    )

    class Meta:
        model = AreaDataSubmission
        fields = [
            "id",
            "dataset",
            "dataset_name",
            "province",
            "province_name",
            "area_council",
            "area_council_name",
            "year",
            "items",
            "status",
            "submitted_at",
            "submitted_by",
            "submitted_by_username",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "created",
            "updated",
        ]
        read_only_fields = [
            "submitted_at",
            "reviewed_by",
            "reviewed_at",
            "rejection_reason",
            "status",
        ]


class AreaDataSubmissionCreateUpdateSerializer(serializers.ModelSerializer):
    """For area admins: create/update submissions (draft or submit)."""

    class Meta:
        model = AreaDataSubmission
        fields = [
            "dataset",
            "province",
            "area_council",
            "year",
            "items",
        ]

    def validate_items(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("items must be a list")
        for i, item in enumerate(value):
            if not isinstance(item, dict):
                raise serializers.ValidationError(
                    f"items[{i}] must be an object with 'attribute' and 'value'"
                )
            if "attribute" not in item or "value" not in item:
                raise serializers.ValidationError(
                    f"items[{i}] must have 'attribute' and 'value'"
                )
            try:
                float(item["value"])
            except (TypeError, ValueError):
                raise serializers.ValidationError(
                    f"items[{i}].value must be a number"
                )
        return value
