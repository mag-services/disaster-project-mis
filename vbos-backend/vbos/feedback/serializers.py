from rest_framework import serializers
from .models import Feedback, FEEDBACK_CATEGORIES


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ["category", "message", "screenshot", "user_email", "page_url", "user_agent"]
        read_only_fields = ["user"]
        extra_kwargs = {
            "screenshot": {"required": False, "allow_null": True},
            "user_email": {"required": False, "allow_blank": True},
            "page_url": {"required": False, "allow_blank": True},
            "user_agent": {"required": False, "allow_blank": True},
        }
