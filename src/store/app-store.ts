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
  locale: 'es' | 'en';
  setLocale: (locale: 'es' | 'en') => void;
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
  sseStatus: 'connecting' | 'connected' | 'disconnected';
  setSseStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
  pushEnabled: boolean;
  setPushEnabled: (v: boolean) => void;
  residenceType: string;
  setResidenceType: (v: string) => void;
  specialNeeds: string[];
  setSpecialNeeds: (v: string[]) => void;
  hasSeenOnboarding: boolean;
  dismissOnboarding: () => void;
  backendToken: string | null;
  setBackendToken: (token: string | null) => void;
  authUser: { id: number; name: string; email: string; image: string; role: string } | null;
  setAuthUser: (user: AppState['authUser']) => void;
  clearAuth: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: 'es' as const,
      setLocale: (locale: 'es' | 'en') => {
        document.cookie = `locale=${locale};path=/;max-age=31536000`;
        set({ locale });
        window.location.reload();
      },
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
      sseStatus: 'disconnected' as const,
      setSseStatus: (sseStatus) => set({ sseStatus }),
      pushEnabled: false,
      setPushEnabled: (pushEnabled) => set({ pushEnabled }),
      residenceType: '',
      setResidenceType: (residenceType) => set({ residenceType }),
      specialNeeds: [],
      setSpecialNeeds: (specialNeeds) => set({ specialNeeds }),
      hasSeenOnboarding: false,
      dismissOnboarding: () => set({ hasSeenOnboarding: true }),
      backendToken: null,
      setBackendToken: (backendToken) => set({ backendToken }),
      authUser: null,
      setAuthUser: (authUser) => set({ authUser }),
      clearAuth: () => set({ backendToken: null, authUser: null }),
    }),
    {
      name: 'truerisk-province',
      partialize: (state) => ({
        locale: state.locale,
        provinceCode: state.provinceCode,
        activeMapLayer: state.activeMapLayer,
        panelsVisible: state.panelsVisible,
        pushEnabled: state.pushEnabled,
        residenceType: state.residenceType,
        specialNeeds: state.specialNeeds,
        hasSeenOnboarding: state.hasSeenOnboarding,
        backendToken: state.backendToken,
      }),
    }
  )
);
