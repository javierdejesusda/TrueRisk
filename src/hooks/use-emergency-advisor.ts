'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/store/app-store';
import { getGuidanceForRisk, type EmergencyGuidance } from '@/lib/constants/emergency-guidance';

export function useEmergencyGuidance() {
  const risk = useAppStore((s) => s.risk);
  const locale = useAppStore((s) => s.locale);

  const guidance = useMemo<EmergencyGuidance | null>(
    () => getGuidanceForRisk(risk?.dominant_hazard, risk?.composite_score, locale),
    [risk?.dominant_hazard, risk?.composite_score, locale],
  );

  return { guidance };
}
