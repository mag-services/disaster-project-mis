import { LuLoader, LuX } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useTaskStatus } from "@/hooks/useTaskStatus";
import { TaskProgressBar } from "@/components/TaskProgressBar";
import { cn } from "@/lib/utils";
import { isTerminalTaskStatus, type CeleryTaskState } from "@/api/taskStatus";

export interface TaskJobBannerProps {
  taskId: string | null;
  /** Shown above the bar (e.g. "Backup in progress"). */
  title: string;
  /** Passed to `useTaskStatus` for toasts. */
  toastTitle?: string;
  /** When the task ends (success, failure, revoked), parent can clear task id. */
  onDone?: (status: CeleryTaskState) => void;
  /** After user dismisses the completed banner. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Inline banner: polls `GET /api/v1/tasks/<id>/status/` and shows a progress bar + toasts on completion.
 * Use when a mutation returns `{ task_id: "..." }` from Celery.
 */
export function TaskJobBanner({
  taskId,
  title,
  toastTitle,
  onDone,
  onDismiss,
  className,
}: TaskJobBannerProps) {
  const { data, isPolling, progress, last, reset } = useTaskStatus(taskId, {
    enabled: Boolean(taskId),
    label: title,
    toastTitle: toastTitle ?? title,
    onSettled: (d) => {
      if (isTerminalTaskStatus(d.status)) {
        onDone?.(d.status);
      }
    },
  });

  if (!taskId) return null;

  const status = data?.status ?? last?.status ?? "PENDING";
  const terminal = isTerminalTaskStatus(status);
  const indeterminate =
    !terminal && (status === "PENDING" || (status === "STARTED" && progress <= 0));

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          {isPolling && !terminal ? (
            <LuLoader className="size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
          ) : null}
          <span className="truncate">{title}</span>
        </div>
        {terminal ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label="Dismiss"
            onClick={() => {
              reset();
              onDismiss?.();
            }}
          >
            <LuX className="size-4" />
          </Button>
        ) : null}
      </div>
      <TaskProgressBar
        progress={progress}
        indeterminate={indeterminate}
        hidePercent={indeterminate}
        label={terminal ? `Status: ${status}` : undefined}
      />
    </div>
  );
}
