/**
 * Profile settings: auto-lock timeout and 4-digit PIN setup.
 */
import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLockStore, AUTO_LOCK_OPTIONS, type AutoLockMinutes } from "@/store/lock-store";
import { toast } from "@/utils/toast";
import { LuLock, LuShield } from "react-icons/lu";

type ProfileSettingsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ProfileSettingsDialog({ isOpen, onClose }: ProfileSettingsDialogProps) {
  const {
    autoLockTimeoutMinutes,
    setAutoLockTimeout,
    setPin,
    pinHash,
  } = useLockStore();

  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isSavingPin, setIsSavingPin] = useState(false);

  const handleSavePin = useCallback(async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      toast.error("Invalid PIN", "PIN must be exactly 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs don't match", "Please enter the same PIN in both fields.");
      return;
    }
    setIsSavingPin(true);
    try {
      await setPin(newPin);
      setNewPin("");
      setConfirmPin("");
      toast.success("PIN saved", "Your unlock PIN has been set.");
    } catch {
      toast.error("Failed to save PIN", "Please try again.");
    } finally {
      setIsSavingPin(false);
    }
  }, [newPin, confirmPin, setPin]);

  const handleTimeoutChange = useCallback(
    (value: string) => {
      const minutes = Number(value) as AutoLockMinutes;
      setAutoLockTimeout(minutes);
      if (minutes > 0 && !pinHash) {
        toast.warning(
          "Set a PIN first",
          "Enable auto-lock by setting a 4-digit PIN below."
        );
      } else if (minutes > 0) {
        toast.success("Auto-lock enabled", `Screen will lock after ${minutes} minute${minutes === 1 ? "" : "s"} of inactivity.`);
      } else {
        toast.success("Auto-lock disabled", "Screen will not lock automatically.");
      }
    },
    [setAutoLockTimeout, pinHash]
  );

  const pinDirty = newPin || confirmPin;
  const canSavePin = newPin.length === 4 && confirmPin.length === 4 && newPin === confirmPin;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={true}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LuShield className="size-5 text-primary" />
            Profile & security
          </DialogTitle>
          <DialogDescription>
            Configure auto-lock and unlock PIN for your session.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Auto-lock timeout */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="auto-lock">Auto-lock after inactivity</Label>
            <Select
              value={String(autoLockTimeoutMinutes)}
              onValueChange={handleTimeoutChange}
            >
              <SelectTrigger id="auto-lock" className="w-full">
                <SelectValue placeholder="Select timeout" />
              </SelectTrigger>
              <SelectContent>
                {AUTO_LOCK_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When idle, the screen locks instead of logging out. Enter your PIN to resume.
            </p>
          </div>

          {/* PIN setup */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-2">
              <LuLock className="size-4" />
              Unlock PIN {pinHash ? "(change)" : "(required for auto-lock)"}
            </Label>
            <div className="flex gap-2">
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="font-mono-num text-center"
                aria-label="New 4-digit PIN"
              />
              <Input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                className="font-mono-num text-center"
                aria-label="Confirm 4-digit PIN"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              4 digits. Used to unlock the screen after auto-lock. Not sent to the server.
            </p>
          </div>
        </div>

        <DialogFooter>
          {pinDirty && (
            <Button
              onClick={handleSavePin}
              disabled={!canSavePin || isSavingPin}
            >
              {isSavingPin ? "Saving…" : "Save PIN"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
