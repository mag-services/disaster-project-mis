"""Forms for backup configuration."""
from django import forms

from .constants import BACKUP_CATEGORIES, CAT_APP_DATA, COMPRESSION_CHOICES


class BackupConfigForm(forms.Form):
    """Form for backup configuration."""

    backup_mode = forms.ChoiceField(
        choices=[("full", "Full System Backup (everything – recommended)"), ("custom", "Custom Backup (select below)")],
        widget=forms.RadioSelect,
        initial="full",
    )

    # Dynamic categories - built in __init__
    compression = forms.ChoiceField(choices=COMPRESSION_CHOICES, initial="medium")
    filename = forms.CharField(required=False, max_length=255)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for cat in BACKUP_CATEGORIES:
            self.fields[f"cat_{cat['key']}"] = forms.BooleanField(
                required=False,
                initial=True,
                label=cat["label"],
            )

    def get_selected_categories(self):
        """Return list of selected category keys."""
        all_cats = [c["key"] for c in BACKUP_CATEGORIES]
        if self.cleaned_data.get("backup_mode") == "full":
            return all_cats
        return [k for k in all_cats if self.cleaned_data.get(f"cat_{k}")]


class RestoreForm(forms.Form):
    """Form for restore."""

    backup_file = forms.FileField(
        label="Backup file",
        help_text="Upload a .zip backup file created by this system.",
    )
    password = forms.CharField(required=False, widget=forms.PasswordInput(attrs={"placeholder": "If backup was encrypted"}))
    dry_run = forms.BooleanField(required=False, initial=False, label="Dry-run only (preview what will change)")
    overwrite = forms.BooleanField(required=False, initial=False, label="Overwrite existing records")
    merge = forms.BooleanField(required=False, initial=False, label="Merge (keep newer versions)")
