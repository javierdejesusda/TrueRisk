import type { ResidenceType } from '@/types/user';

export interface ResidenceTypeInfo {
  label: string;
  labelEs: string;
  vulnerabilityScore: number;
}

/**
 * Vulnerability scores for each residence type.
 * Higher scores indicate greater vulnerability to weather emergencies.
 */
export const RESIDENCE_TYPES: Record<ResidenceType, ResidenceTypeInfo> = {
  sotano: {
    label: 'Basement',
    labelEs: 'Sotano',
    vulnerabilityScore: 1.0,
  },
  planta_baja: {
    label: 'Ground Floor',
    labelEs: 'Planta Baja',
    vulnerabilityScore: 0.8,
  },
  piso_bajo: {
    label: 'Low Floor (1-3)',
    labelEs: 'Piso Bajo (1-3)',
    vulnerabilityScore: 0.4,
  },
  piso_alto: {
    label: 'High Floor (4+)',
    labelEs: 'Piso Alto (4+)',
    vulnerabilityScore: 0.2,
  },
  atico: {
    label: 'Penthouse',
    labelEs: 'Atico',
    vulnerabilityScore: 0.3,
  },
  casa_unifamiliar: {
    label: 'Detached House',
    labelEs: 'Casa Unifamiliar',
    vulnerabilityScore: 0.6,
  },
  caravana: {
    label: 'Mobile Home',
    labelEs: 'Caravana',
    vulnerabilityScore: 0.9,
  },
};
