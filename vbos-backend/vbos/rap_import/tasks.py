"""Celery tasks for RAP import batches (optional when Celery is configured)."""

from __future__ import annotations

from celery import shared_task


@shared_task(bind=True, ignore_result=False)
def import_rap_batch_task(self, batch_pk: int) -> str:
    """
    Queue import for a batch: runs the same logic as the admin “Run import” sync path.
    """
    from vbos.rap_import.models import RAPImportBatch
    from vbos.rap_import.services import import_rap_batch_to_tabular

    batch = RAPImportBatch.objects.get(pk=batch_pk)
    try:
        for f in batch.files.filter(status="ok"):
            with f.file.open("rb") as fh:
                import_rap_batch_to_tabular(batch, fh, sector_family=f.sector_family)
        batch.status = "complete"
        batch.save(update_fields=["status"])
        return f"Batch {batch.batch_ref} import complete."
    except Exception as exc:
        batch.status = "failed"
        batch.save(update_fields=["status"])
        raise exc
