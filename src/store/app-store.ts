import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CurrentWeather } from '@/types/weather';
import type { Alert } from '@/types/alert';
import type { CompositeRiskScore } from '@/types/risk';

type MapLayer = 'risk' | 'alerts';

interface PanelsVisible {
  weather: boolean;
  risk: boolean;
  alerts: boolean;
}

interface AppState {
  provinceCode: string;
  setProvinceCode: (code: string) => void;
  weather: CurrentWeather | null;
  setWeather: (weather: CurrentWeather | null) => void;
  alerts: Alert[];
  setAlerts: (alerts: Alert[]) => void;
  risk: CompositeRiskScore | null;
  setRisk: (risk: CompositeRiskScore | null) => void;
  activeMapLayer: MapLayer;
  setActiveMapLayer: (layer: MapLayer) => void;
  panelsVisible: PanelsVisible;
  togglePanel: (panel: keyof PanelsVisible) => void;
  mapSelectedProvince: string | null;
  setMapSelectedProvince: (code: string | null) => void;
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
      activeMapLayer: 'risk',
      setActiveMapLayer: (activeMapLayer) => set({ activeMapLayer }),
      panelsVisible: { weather: true, risk: true, alerts: true },
      togglePanel: (panel) =>
        set((s) => ({
          panelsVisible: { ...s.panelsVisible, [panel]: !s.panelsVisible[panel] },
        })),
      mapSelectedProvince: null,
      setMapSelectedProvince: (mapSelectedProvince) => set({ mapSelectedProvince }),
    }),
    {
      name: 'truerisk-province',
      partialize: (state) => ({
        provinceCode: state.provinceCode,
        activeMapLayer: state.activeMapLayer,
        panelsVisible: state.panelsVisible,
      }),
    }
  )
);
