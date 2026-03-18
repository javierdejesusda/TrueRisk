import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentWeather } from '@/types/weather';
import type { Alert } from '@/types/alert';
import type { CompositeRiskScore } from '@/types/risk';

interface AppState {
  provinceCode: string;
  setProvinceCode: (code: string) => void;
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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      provinceCode: '28',
      setProvinceCode: (provinceCode) => set({ provinceCode }),
      weather: null,
      setWeather: (weather) => set({ weather }),
      alerts: [],
      setAlerts: (alerts) => set({ alerts }),
      risk: null,
      setRisk: (risk) => set({ risk }),
      sidebarOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'truerisk-province',
      partialize: (state) => ({ provinceCode: state.provinceCode }),
    }
  )
);
