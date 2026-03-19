'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { getGuidanceForRisk, type EmergencyGuidance } from '@/lib/constants/emergency-guidance';

export function useEmergencyGuidance() {
  const risk = useAppStore((s) => s.risk);

  const guidance = useMemo<EmergencyGuidance | null>(
    () => getGuidanceForRisk(risk?.dominant_hazard, risk?.composite_score),
    [risk?.dominant_hazard, risk?.composite_score],
  );

  return { guidance };
}
