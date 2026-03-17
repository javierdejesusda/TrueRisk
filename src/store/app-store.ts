import { create } from 'zustand';
import type { UserProfile } from '@/types/user';
import type { ParsedWeather } from '@/types/weather';
import type { Alert } from '@/types/alert';

interface AppState {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  weather: ParsedWeather | null;
  setWeather: (weather: ParsedWeather | null) => void;
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
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
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
