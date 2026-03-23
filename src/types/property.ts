import type { HazardType, RiskSeverity } from './risk';

export interface FloodZoneDetail {
  in_arpsi_zone: boolean;
  zone_id: string | null;
  zone_name: string | null;
  zone_type: string | null;
  return_period: string | null;
  risk_level: string | null;
  distance_to_nearest_zone_m: number | null;
}

export interface WildfireProximityDetail {
  elevation_m: number;
  slope_pct: number;
  modifier: number;
  explanation: string;
}

export interface TerrainDetail {
  elevation_m: number;
  slope_pct: number;
}

export interface HazardScoreDetail {
  score: number;
  severity: RiskSeverity;
  province_score: number;
  modifier: number;
  explanation: string;
}

export interface PropertyReportResponse {
  report_id: string;
  address_text: string;
  formatted_address: string;
  latitude: number;
  longitude: number;
  province_code: string;
  province_name: string;
  municipality_code: string | null;

  composite_score: number;
  dominant_hazard: HazardType | string;
  severity: RiskSeverity;

  flood: HazardScoreDetail;
  wildfire: HazardScoreDetail;
  heatwave: HazardScoreDetail;
  drought: HazardScoreDetail;
  coldwave: HazardScoreDetail;
  windstorm: HazardScoreDetail;
  seismic: HazardScoreDetail;

  flood_zone: FloodZoneDetail;
  wildfire_proximity: WildfireProximityDetail;
  terrain: TerrainDetail;

  computed_at: string;
  expires_at: string | null;
  pdf_available: boolean;
  share_url: string;
}

export interface PropertyReportListItem {
  report_id: string;
  address_text: string;
  formatted_address: string;
  composite_score: number;
  severity: RiskSeverity;
  dominant_hazard: string;
  computed_at: string;
}
