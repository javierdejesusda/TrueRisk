export type HazardType = "flood" | "wildfire" | "drought" | "heatwave";
export type RiskSeverity = "low" | "moderate" | "high" | "very_high" | "critical";

export interface CompositeRiskScore {
  province_code: string;
  composite_score: number;
  flood_score: number;
  wildfire_score: number;
  drought_score: number;
  heatwave_score: number;
  dominant_hazard: HazardType;
  severity: RiskSeverity;
  computed_at: string;
}

export interface RiskMapEntry {
  province_code: string;
  province_name: string;
  latitude: number;
  longitude: number;
  composite_score: number;
  dominant_hazard: HazardType;
  severity: RiskSeverity;
  flood_score: number;
  wildfire_score: number;
  drought_score: number;
  heatwave_score: number;
}

export interface RiskMapResponse {
  provinces: RiskMapEntry[];
  computed_at: string;
}
