import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchTaskStatus,
  isTerminalTaskStatus,
  type CeleryTaskState,
  type TaskStatusResponse,
} from "@/api/taskStatus";
import { toast } from "@/utils/toast";

export interface UseTaskStatusOptions {
  /** When false, no polling (default: true when taskId is set). */
  enabled?: boolean;
  /** Default 1500 ms. */
  pollIntervalMs?: number;
  /** Label for progress UI (e.g. "Backup"). */
  label?: string;
  /** Show toast on SUCCESS / FAILURE (default true). */
  showToast?: boolean;
  /** Toast title prefix (default: label or "Task"). */
  toastTitle?: string;
  onSuccess?: (data: TaskStatusResponse) => void;
  onFailure?: (data: TaskStatusResponse) => void;
  onSettled?: (data: TaskStatusResponse) => void;
}


export interface UseTaskStatusResult {
  data: TaskStatusResponse | null;
  error: Error | null;
  isPolling: boolean;
  status: CeleryTaskState | null;
  progress: number;
  /** Last successful fetch (or null). */
  last: TaskStatusResponse | null;
  /** Stop polling and clear local state for this task id. */
  reset: () => void;
}

/**
 * Polls `GET /api/v1/tasks/<task_id>/status/` until the task reaches a terminal state.
 * Use after an API returns a Celery `task_id` (backup, import, etc.).
 */
export function useTaskStatus(
  taskId: string | null,
  options: UseTaskStatusOptions = {},
): UseTaskStatusResult {
  const {
    enabled = true,
    pollIntervalMs = 1500,
    label,
    showToast = true,
    toastTitle,
    onSuccess,
    onFailure,
    onSettled,
  } = options;

  const onSuccessRef = useRef(onSuccess);
  const onFailureRef = useRef(onFailure);
  const onSettledRef = useRef(onSettled);
  onSuccessRef.current = onSuccess;
  onFailureRef.current = onFailure;
  onSettledRef.current = onSettled;

  const [data, setData] = useState<TaskStatusResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [last, setLast] = useState<TaskStatusResponse | null>(null);
  const notifiedRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsPolling(false);
    setLast(null);
    notifiedRef.current = null;
  }, []);

  const runRef = useRef(0);

  useEffect(() => {
    if (!taskId || !enabled) {
      setIsPolling(false);
      return;
    }

    const runId = ++runRef.current;
    notifiedRef.current = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const titleBase = toastTitle ?? label ?? "Task";

    const notifyOnce = (key: string, fn: () => void) => {
      const k = `${taskId}:${key}`;
      if (notifiedRef.current === k) return;
      notifiedRef.current = k;
      fn();
    };

    const poll = async () => {
      if (cancelled || runRef.current !== runId) return;
      setIsPolling(true);
      setError(null);
      try {
        const d = await fetchTaskStatus(taskId);
        if (cancelled || runRef.current !== runId) return;
        setData(d);
        setLast(d);

        if (isTerminalTaskStatus(d.status)) {
          setIsPolling(false);
          onSettledRef.current?.(d);
          if (d.status === "SUCCESS") {
            onSuccessRef.current?.(d);
            if (showToast) {
              notifyOnce("ok", () => {
                toast.success(`${titleBase} complete`, "Finished successfully.");
              });
            }
          } else if (d.status === "FAILURE") {
            onFailureRef.current?.(d);
            if (showToast) {
              notifyOnce("fail", () => {
                const msg =
                  typeof d.result === "string"
                    ? d.result
                    : d.result != null
                      ? JSON.stringify(d.result)
                      : "The task failed.";
                toast.error(`${titleBase} failed`, msg);
              });
            }
          } else {
            onSettledRef.current?.(d);
            if (showToast) {
              notifyOnce("revoked", () => {
                toast.warning(`${titleBase} stopped`, "Task was revoked or cancelled.");
              });
            }
          }
          return;
        }

        timer = setTimeout(poll, pollIntervalMs);
      } catch (e) {
        if (cancelled || runRef.current !== runId) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        setIsPolling(false);
        if (showToast) {
          notifyOnce("err", () => {
            toast.error(`${titleBase} status error`, err.message);
          });
        }
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [taskId, enabled, pollIntervalMs, showToast, toastTitle, label]);

  const status = data?.status ?? last?.status ?? null;
  const progress = data?.progress ?? last?.progress ?? 0;

  return {
    data,
    error,
    isPolling,
    status,
    progress,
    last,
    reset,
  };
}
