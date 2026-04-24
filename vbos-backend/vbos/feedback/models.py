"""
User feedback: bugs, feature requests, general feedback with optional screenshot.
"""
from django.db import models
from django.conf import settings

FEEDBACK_CATEGORY_BUG = "bug"
FEEDBACK_CATEGORY_FEATURE = "feature"
FEEDBACK_CATEGORY_GENERAL = "general"
FEEDBACK_CATEGORIES = [
    (FEEDBACK_CATEGORY_BUG, "Bug"),
    (FEEDBACK_CATEGORY_FEATURE, "Feature request"),
    (FEEDBACK_CATEGORY_GENERAL, "General feedback"),
]


def feedback_screenshot_path(instance, filename):
    """Store screenshots in feedback/YYYY-MM/"""
    from django.utils import timezone
    return f"feedback/{timezone.now().strftime('%Y-%m')}/{filename}"


class Feedback(models.Model):
    category = models.CharField(max_length=20, choices=FEEDBACK_CATEGORIES)
    message = models.TextField()
    screenshot = models.ImageField(upload_to=feedback_screenshot_path, blank=True, null=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="feedback_submissions",
    )
    user_email = models.EmailField(blank=True)
    page_url = models.URLField(max_length=500, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Feedback"

    def __str__(self):
        return f"{self.get_category_display()} – {self.created_at:%Y-%m-%d %H:%M}"
