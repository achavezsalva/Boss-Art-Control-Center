import { create } from 'zustand';
import { SystemMetrics } from '../types';

interface SystemState {
  metrics: SystemMetrics | null;
  setMetrics: (metrics: SystemMetrics) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  metrics: null,
  setMetrics: (metrics) => set({ metrics }),
}));
