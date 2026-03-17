export type Role = 'citizen' | 'backoffice';

export type ResidenceType = 'sotano' | 'planta_baja' | 'piso_bajo' | 'piso_alto' | 'atico' | 'casa_unifamiliar' | 'caravana';

export type SpecialNeed = 'wheelchair' | 'elderly' | 'children' | 'pets' | 'medical_equipment' | 'hearing_impaired' | 'visual_impaired' | 'respiratory';

export interface UserProfile {
  id: number;
  nickName: string;
  role: Role;
  province: string;
  residenceType: ResidenceType;
  specialNeeds: SpecialNeed[];
}
