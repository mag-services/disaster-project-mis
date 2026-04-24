"""Unfold ENVIRONMENT callback — shows a badge in the admin header."""
import os


def environment_callback(request):
    env = os.environ.get("DJANGO_CONFIGURATION", "Development")
    if env in ("Vm", "Production"):
        return ["Production", "danger"]
    if env == "Staging":
        return ["Staging", "warning"]
    return ["Dev", "info"]
