# Merge parallel 0002 migrations (acting_organisation vs index renames) into one graph head.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("audit", "0002_auditlog_acting_organisation"),
        ("audit", "0002_rename_audit_audit_content_0c6b_idx_audit_audit_content_4c2ead_idx_and_more"),
    ]

    operations = []
