from rest_framework import serializers

from vbos.datasets.models import Province

from .models import Alert
from .models import AlertSeverity, AlertType


class AlertSerializer(serializers.ModelSerializer):
    """Serialises an internal DRMIS Alert to the LiveAlert wire format."""

    type = serializers.CharField(source="alert_type")
    url = serializers.CharField(default="")

    class Meta:
        model = Alert
        fields = [
            "id",
            "source",
            "title",
            "summary",
            "issued_at",
            "type",
            "severity",
            "url",
        ]


class AlertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating internal DRMIS alerts from frontend workflows."""

    type = serializers.ChoiceField(
        source="alert_type",
        choices=AlertType.choices,
        required=False,
        default=AlertType.OPERATIONAL,
    )
    severity = serializers.ChoiceField(
        choices=AlertSeverity.choices,
        required=False,
        default=AlertSeverity.INFO,
    )
    province = serializers.PrimaryKeyRelatedField(
        queryset=Province.objects.all(),
        required=False,
        allow_null=True,
    )
    issued_at = serializers.DateTimeField(required=False)

    class Meta:
        model = Alert
        fields = [
            "title",
            "summary",
            "type",
            "severity",
            "province",
            "url",
            "issued_at",
            "is_active",
        ]
