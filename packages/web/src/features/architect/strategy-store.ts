import { create } from "zustand";
import type { Leg } from "./payoff";

let _nextLegId = 1;

interface StrategyState {
  legs: Leg[];
  addLeg: (leg: Omit<Leg, "id">) => void;
  removeLeg: (id: string) => void;
  updateLeg: (id: string, patch: Partial<Leg>) => void;
  clearLegs: () => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  legs: [],

  addLeg: (leg) =>
    set((s) => ({
      legs: [...s.legs, { ...leg, id: `leg-${_nextLegId++}` }],
    })),

  removeLeg: (id) =>
    set((s) => ({
      legs: s.legs.filter((l) => l.id !== id),
    })),

  updateLeg: (id, patch) =>
    set((s) => ({
      legs: s.legs.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    })),

  clearLegs: () => set({ legs: [] }),
}));
