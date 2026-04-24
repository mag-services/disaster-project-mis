from rest_framework import serializers

from vbos.organisations.models import Organisation


class OrganisationMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = ("id", "name", "slug", "short_name")
