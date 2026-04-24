import { create } from "zustand";

interface OfflineState {
  isOnline: boolean;
  queuedActions: number;
  setOnline: (online: boolean) => void;
  incrementQueued: () => void;
  decrementQueued: (n?: number) => void;
  setQueued: (n: number) => void;
  clearQueued: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  queuedActions: 0,

  setOnline: (online) => set({ isOnline: online }),

  incrementQueued: () => set((s) => ({ queuedActions: s.queuedActions + 1 })),

  decrementQueued: (n = 1) =>
    set((s) => ({ queuedActions: Math.max(0, s.queuedActions - n) })),

  setQueued: (n) => set({ queuedActions: Math.max(0, n) }),

  clearQueued: () => set({ queuedActions: 0 }),
}));
