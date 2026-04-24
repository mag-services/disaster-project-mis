/**
 * Idle detection → lock screen after inactivity.
 * Uses react-idle-timer; only active when auto-lock is enabled and PIN is set.
 * Shows non-blocking toast 30–60s before lock via onPrompt.
 */
import { useCallback, useMemo } from "react";
import { useIdleTimer } from "react-idle-timer";
import { useLockStore } from "@/store/lock-store";
import { toast } from "@/utils/toast";

const PROMPT_SHORT_MS = 30 * 1000; // 30s for short timeouts (1–5 min)
const PROMPT_LONG_MS = 60 * 1000; // 60s for longer timeouts (10+ min)

export function useAutoLock() {
  const {
    lock,
    autoLockTimeoutMinutes,
    pinHash,
    isLocked,
  } = useLockStore();

  const timeoutMs =
    autoLockTimeoutMinutes > 0 && pinHash
      ? autoLockTimeoutMinutes * 60 * 1000
      : 0;

  const { promptBeforeIdle, promptSeconds } = useMemo(() => {
    if (timeoutMs <= PROMPT_SHORT_MS) return { promptBeforeIdle: 0, promptSeconds: 0 };
    const useLong = timeoutMs > 5 * 60 * 1000; // 5 min
    const ms = useLong ? PROMPT_LONG_MS : PROMPT_SHORT_MS;
    return {
      promptBeforeIdle: ms,
      promptSeconds: ms / 1000,
    };
  }, [timeoutMs]);

  const onIdle = useCallback(() => {
    if (pinHash) lock();
  }, [lock, pinHash]);

  const onPrompt = useCallback(() => {
    toast.warning(
      `Session will lock in ${promptSeconds}s`,
      "Move mouse or press key to stay signed in."
    );
  }, [promptSeconds]);

  useIdleTimer({
    onIdle,
    onPrompt: promptBeforeIdle > 0 ? onPrompt : undefined,
    timeout: timeoutMs || 24 * 60 * 60 * 1000, // 24h when disabled (effectively never)
    promptBeforeIdle,
    throttle: 500,
    events: [
      "mousemove",
      "keydown",
      "wheel",
      "mousedown",
      "touchstart",
      "touchmove",
      "visibilitychange",
    ],
    startOnMount: true,
    disabled: timeoutMs === 0 || isLocked,
  });
}
