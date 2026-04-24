# Celery task status API

## `GET /api/v1/tasks/<task_id>/status/`

Returns JSON with Celery task state and best-effort `progress` (0–100) when the task updates meta with `{ "progress": <n> }`.

**Authentication:** required — **Token** (`Authorization: Token …`) or **session** cookie (same as other DRF APIs).

**Response (example):**

```json
{
  "task_id": "…",
  "status": "STARTED",
  "result": { "progress": 42 },
  "progress": 42
}
```

Terminal states: `SUCCESS`, `FAILURE`, `REVOKED` (polling can stop).

Frontend: use `useTaskStatus(taskId)` and optional `TaskJobBanner` in `vbos-frontend`.
