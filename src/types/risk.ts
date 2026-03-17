import type { EmergencyType } from './alert';

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  details: string;
}

export type RiskSeverity = 'low' | 'moderate' | 'high' | 'very_high' | 'critical';

export interface RiskScore {
  score: number;
  severity: RiskSeverity;
  breakdown: RiskFactor[];
  emergencyType: EmergencyType;
  anomalies: string[];
  trend: string;
  historicalSimilarity: string;
  bayesianProbabilities: Record<string, number>;
}
