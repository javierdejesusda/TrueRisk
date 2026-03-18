export type AlertSeverity = 1 | 2 | 3 | 4 | 5;
export type HazardType = "flood" | "wildfire" | "drought" | "heatwave";

export interface Alert {
  id: number;
  severity: AlertSeverity;
  hazard_type: HazardType;
  province_code: string | null;
  title: string;
  description: string;
  source: string;
  is_active: boolean;
  onset: string | null;
  expires: string | null;
  created_at: string;
  updated_at: string;
}
