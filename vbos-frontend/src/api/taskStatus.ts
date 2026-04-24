import * as HTTP from "./http";

const base = (taskId: string) =>
  `/api/v1/tasks/${encodeURIComponent(taskId)}/status/`;

/** Celery / django-celery-results task states */
export type CeleryTaskState =
  | "PENDING"
  | "STARTED"
  | "SUCCESS"
  | "FAILURE"
  | "RETRY"
  | "REVOKED";

export interface TaskStatusResponse {
  task_id: string;
  status: CeleryTaskState;
  result: unknown;
  /** 0–100 from backend (best-effort from task meta) */
  progress: number;
}

function isTaskState(x: string): x is CeleryTaskState {
  return (
    x === "PENDING" ||
    x === "STARTED" ||
    x === "SUCCESS" ||
    x === "FAILURE" ||
    x === "RETRY" ||
    x === "REVOKED"
  );
}

/** GET /api/v1/tasks/<task_id>/status/ — requires auth (Token or session cookie). */
export async function fetchTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  const res = await HTTP.get(base(taskId));
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText || `HTTP ${res.status}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const status = typeof data.status === "string" && isTaskState(data.status) ? data.status : "PENDING";
  const progress =
    typeof data.progress === "number" && Number.isFinite(data.progress)
      ? Math.max(0, Math.min(100, Math.round(data.progress)))
      : 0;
  return {
    task_id: String(data.task_id ?? taskId),
    status,
    result: data.result,
    progress,
  };
}

export function isTerminalTaskStatus(status: CeleryTaskState): boolean {
  return status === "SUCCESS" || status === "FAILURE" || status === "REVOKED";
}
