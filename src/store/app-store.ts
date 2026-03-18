import { create } from 'zustand';
import type { UserProfile } from '@/types/user';
import type { CurrentWeather } from '@/types/weather';
import type { Alert } from '@/types/alert';
import type { CompositeRiskScore } from '@/types/risk';

interface AppState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  weather: CurrentWeather | null;
  setWeather: (weather: CurrentWeather | null) => void;
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  risk: CompositeRiskScore | null;
  setRisk: (risk: CompositeRiskScore | null) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  weather: null,
  setWeather: (weather) => set({ weather }),
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  risk: null,
  setRisk: (risk) => set({ risk }),
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
