from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import FieldCheckRecord


class FieldCheckRecordSerializer(serializers.ModelSerializer):
    content_type_name = serializers.SerializerMethodField()
    verified_by_username = serializers.CharField(source="verified_by.username", read_only=True)

    class Meta:
        model = FieldCheckRecord
        fields = [
            "id",
            "content_type",
            "object_id",
            "content_type_name",
            "status",
            "observed_value",
            "notes",
            "verified_by",
            "verified_by_username",
            "verified_at",
        ]
        read_only_fields = ["verified_by", "verified_at"]

    def get_content_type_name(self, obj):
        return f"{obj.content_type.app_label}.{obj.content_type.model}"

    def validate(self, attrs):
        if attrs["status"] == FieldCheckRecord.STATUS_ADJUSTED and attrs.get("observed_value") is None:
            raise serializers.ValidationError(
                {"observed_value": "Required when status is adjusted."}
            )
        if attrs["status"] == FieldCheckRecord.STATUS_REJECTED and not attrs.get("notes", "").strip():
            raise serializers.ValidationError(
                {"notes": "Required when status is rejected."}
            )
        return attrs


class FieldCheckRecordCreateSerializer(serializers.ModelSerializer):
    """Create a field check record. content_type = ContentType pk (use GET /field-check/content-types/ to list)."""
    content_type = serializers.PrimaryKeyRelatedField(
        queryset=ContentType.objects.filter(model__in=("tabularitem", "vectoritem")),
        required=True,
    )

    class Meta:
        model = FieldCheckRecord
        fields = [
            "content_type",
            "object_id",
            "status",
            "observed_value",
            "notes",
        ]

    def validate(self, attrs):
        if attrs["status"] == FieldCheckRecord.STATUS_ADJUSTED and attrs.get("observed_value") is None:
            raise serializers.ValidationError(
                {"observed_value": "Required when status is adjusted."}
            )
        if attrs["status"] == FieldCheckRecord.STATUS_REJECTED and not attrs.get("notes", "").strip():
            raise serializers.ValidationError(
                {"notes": "Required when status is rejected."}
            )
        return attrs
