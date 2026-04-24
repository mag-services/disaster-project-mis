/**
 * Full-screen lock overlay. User enters 4-digit PIN to unlock.
 * Glassmorphic design, shake animation on wrong PIN.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { LuLock } from "react-icons/lu";
import { useLockStore } from "@/store/lock-store";
import { useAuthStore } from "@/store/auth-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_PIN_ATTEMPTS = 5;

export function LockScreen() {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { unlock, pinAttempts, isLocked } = useLockStore();
  const { user } = useAuthStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLocked]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (pin.length !== 4) return;
      const ok = await unlock(pin);
      if (ok) {
        setPin("");
      } else {
        setPin("");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        inputRef.current?.focus();
      }
    },
    [pin, unlock]
  );

  const remainingAttempts = MAX_PIN_ATTEMPTS - pinAttempts;
  const forceLogout = pinAttempts >= MAX_PIN_ATTEMPTS;

  if (forceLogout) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lock-title"
    >
      <div
        className={cn(
          "glass-surface-strong flex w-full max-w-sm flex-col gap-6 rounded-lg border border-border p-8 shadow-xl transition-transform duration-200",
          shake && "animate-shake"
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-primary">
            <LuLock className="size-7" />
          </div>
          <h2 id="lock-title" className="text-lg font-semibold text-foreground">
            Session locked
          </h2>
          <p className="text-center text-sm text-muted-foreground">
            Enter your 4-digit PIN to continue
            {user?.username && (
              <span className="block mt-1 font-medium text-foreground">
                {user.username}
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            <Input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="h-14 w-32 text-center text-2xl font-mono-num tracking-[0.5em]"
              placeholder="••••"
              aria-label="Enter 4-digit PIN"
              autoComplete="off"
            />
          </div>
          {remainingAttempts < MAX_PIN_ATTEMPTS && (
            <p className="text-center text-xs text-muted-foreground">
              {remainingAttempts > 0
                ? `${remainingAttempts} attempt${remainingAttempts === 1 ? "" : "s"} remaining`
                : "Too many attempts. Logging out..."}
            </p>
          )}
          <Button type="submit" disabled={pin.length !== 4} className="w-full">
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
