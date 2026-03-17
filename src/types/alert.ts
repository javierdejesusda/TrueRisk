export type AlertSeverity = 1 | 2 | 3 | 4 | 5;
export type EmergencyType = 'flood' | 'heat_wave' | 'cold_snap' | 'wind_storm' | 'thunderstorm' | 'general';

export interface Alert {
  id: number;
  severity: AlertSeverity;
  type: EmergencyType;
  province: string | null;
  municipality: string | null;
  title: string;
  description: string;
  isActive: boolean;
  autoDetected: boolean;
  createdAt: Date;
}
