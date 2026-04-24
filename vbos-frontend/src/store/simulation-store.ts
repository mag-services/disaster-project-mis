import { create } from "zustand";

export interface SimulationState {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;

  seaLevelRise: number;
  setSeaLevelRise: (v: number) => void;

  cycloneIntensity: number;
  setCycloneIntensity: (v: number) => void;

  floodDepth: number;
  setFloodDepth: (v: number) => void;

  earthquakeMagnitude: number;
  setEarthquakeMagnitude: (v: number) => void;

  populationAtRisk: number;
  infrastructureDamage: number;
  cropLoss: number;
  estimatedCost: number;

  isRunning: boolean;
  runSimulation: () => void;
  resetAll: () => void;
}

function computeDerived(state: {
  seaLevelRise: number;
  cycloneIntensity: number;
  floodDepth: number;
  earthquakeMagnitude: number;
}) {
  const slrFactor = state.seaLevelRise / 3;
  const cycloneFactor = state.cycloneIntensity / 5;
  const floodFactor = state.floodDepth / 5;
  const eqFactor = state.earthquakeMagnitude / 9;

  const composite = slrFactor * 0.2 + cycloneFactor * 0.35 + floodFactor * 0.25 + eqFactor * 0.2;

  return {
    populationAtRisk: Math.round(Math.min(composite * 100, 100)),
    infrastructureDamage: Math.round(Math.min(composite * 85 + cycloneFactor * 10, 100)),
    cropLoss: Math.round(Math.min(composite * 70 + floodFactor * 20, 100)),
    estimatedCost: Math.round(composite * 450),
  };
}

const INITIAL = {
  seaLevelRise: 0.5,
  cycloneIntensity: 0,
  floodDepth: 0,
  earthquakeMagnitude: 0,
};

export const useSimulationStore = create<SimulationState>()((set) => ({
  isOpen: false,
  setIsOpen: (v) => set({ isOpen: v }),

  ...INITIAL,
  ...computeDerived(INITIAL),
  isRunning: false,

  setSeaLevelRise: (v) => set((s) => ({ seaLevelRise: v, ...computeDerived({ ...s, seaLevelRise: v }) })),
  setCycloneIntensity: (v) => set((s) => ({ cycloneIntensity: v, ...computeDerived({ ...s, cycloneIntensity: v }) })),
  setFloodDepth: (v) => set((s) => ({ floodDepth: v, ...computeDerived({ ...s, floodDepth: v }) })),
  setEarthquakeMagnitude: (v) => set((s) => ({ earthquakeMagnitude: v, ...computeDerived({ ...s, earthquakeMagnitude: v }) })),

  runSimulation: () => {
    set({ isRunning: true });
    setTimeout(() => set({ isRunning: false }), 1800);
  },

  resetAll: () => set({ ...INITIAL, ...computeDerived(INITIAL), isRunning: false }),
}));
