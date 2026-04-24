from rest_framework import serializers

from vbos.datasets.models import MapSavedWorkspace
from vbos.datasets.workspace_payload import validate_workspace_payload


class MapSavedWorkspaceListSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapSavedWorkspace
        fields = ("id", "name", "created_at", "updated_at")


class MapSavedWorkspaceDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapSavedWorkspace
        fields = ("id", "name", "payload", "created_at", "updated_at")


class MapSavedWorkspaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapSavedWorkspace
        fields = ("id", "name", "payload", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_name(self, value: str) -> str:
        v = (value or "").strip()
        if not v:
            raise serializers.ValidationError("Name is required.")
        if len(v) > 120:
            raise serializers.ValidationError("Name is too long.")
        return v

    def validate_payload(self, value):
        return validate_workspace_payload(value)


class MapSavedWorkspaceUpdateSerializer(serializers.ModelSerializer):
    payload = serializers.JSONField(required=False)

    class Meta:
        model = MapSavedWorkspace
        fields = ("name", "payload")

    def validate_name(self, value: str) -> str:
        if value is None:
            return value
        v = value.strip()
        if not v:
            raise serializers.ValidationError("Name cannot be empty.")
        if len(v) > 120:
            raise serializers.ValidationError("Name is too long.")
        return v

    def validate_payload(self, value):
        if value is None:
            return value
        return validate_workspace_payload(value)
