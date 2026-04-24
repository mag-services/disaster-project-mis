import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hashPin, verifyPin } from "@/utils/pinHash";
import { useAuthStore } from "./auth-store";

const LOCK_STORE_KEY = "vbos-lock-settings";
const MAX_PIN_ATTEMPTS = 5;

export const AUTO_LOCK_OPTIONS = [
  { value: 0, label: "Off" },
  { value: 1, label: "1 minute" },
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
] as const;

export type AutoLockMinutes = (typeof AUTO_LOCK_OPTIONS)[number]["value"];

interface LockState {
  isLocked: boolean;
  pinHash: string | null;
  pinAttempts: number;
  autoLockTimeoutMinutes: AutoLockMinutes;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  setPin: (pin: string) => Promise<void>;
  setAutoLockTimeout: (minutes: AutoLockMinutes) => void;
  resetAttempts: () => void;
  resetLockOnLogout: () => void;
  incrementAttempts: () => void;
}

export const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      isLocked: false,
      pinHash: null,
      pinAttempts: 0,
      autoLockTimeoutMinutes: 0,

      lock: () => set({ isLocked: true }),

      unlock: async (pin: string) => {
        const { pinHash } = get();
        if (!pinHash) return false;
        const ok = await verifyPin(pin, pinHash);
        if (ok) {
          set({ isLocked: false, pinAttempts: 0 });
          return true;
        }
        const attempts = get().pinAttempts + 1;
        set({ pinAttempts: attempts });
        if (attempts >= MAX_PIN_ATTEMPTS) {
          useAuthStore.getState().clearAuth();
        }
        return false;
      },

      setPin: async (pin: string) => {
        const hash = await hashPin(pin);
        set({ pinHash: hash, pinAttempts: 0 });
      },

      setAutoLockTimeout: (minutes) =>
        set({ autoLockTimeoutMinutes: minutes }),

      resetAttempts: () => set({ pinAttempts: 0 }),

      resetLockOnLogout: () => set({ isLocked: false, pinAttempts: 0 }),

      incrementAttempts: () =>
        set((s) => {
          const next = s.pinAttempts + 1;
          if (next >= MAX_PIN_ATTEMPTS) {
            useAuthStore.getState().clearAuth();
          }
          return { pinAttempts: next };
        }),
    }),
    {
      name: LOCK_STORE_KEY,
      partialize: (s) => ({
        pinHash: s.pinHash,
        autoLockTimeoutMinutes: s.autoLockTimeoutMinutes,
      }),
    }
  )
);
