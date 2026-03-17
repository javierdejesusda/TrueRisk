export interface ProvinceInfo {
  name: string;
  riskWeight: number;
  region: string;
}

/**
 * Map of Spanish provinces with flood/wind risk weights (0.0 - 1.0).
 * Keys are province codes.
 */
export const PROVINCES: Record<string, ProvinceInfo> = {
  // High risk - Mediterranean coast & flood-prone
  V: { name: 'Valencia', riskWeight: 0.9, region: 'Comunidad Valenciana' },
  A: { name: 'Alicante', riskWeight: 0.85, region: 'Comunidad Valenciana' },
  MU: { name: 'Murcia', riskWeight: 0.8, region: 'Region de Murcia' },
  MA: { name: 'Malaga', riskWeight: 0.75, region: 'Andalucia' },
  CS: { name: 'Castellon', riskWeight: 0.8, region: 'Comunidad Valenciana' },
  AL: { name: 'Almeria', riskWeight: 0.7, region: 'Andalucia' },

  // Medium risk - coastal & river basins
  B: { name: 'Barcelona', riskWeight: 0.5, region: 'Cataluna' },
  SE: { name: 'Sevilla', riskWeight: 0.6, region: 'Andalucia' },
  CA: { name: 'Cadiz', riskWeight: 0.65, region: 'Andalucia' },
  T: { name: 'Tarragona', riskWeight: 0.55, region: 'Cataluna' },
  GI: { name: 'Girona', riskWeight: 0.5, region: 'Cataluna' },
  PM: { name: 'Illes Balears', riskWeight: 0.6, region: 'Illes Balears' },
  GR: { name: 'Granada', riskWeight: 0.55, region: 'Andalucia' },
  HU: { name: 'Huelva', riskWeight: 0.5, region: 'Andalucia' },
  CO: { name: 'Cordoba', riskWeight: 0.45, region: 'Andalucia' },
  J: { name: 'Jaen', riskWeight: 0.4, region: 'Andalucia' },

  // Low-medium risk
  M: { name: 'Madrid', riskWeight: 0.3, region: 'Comunidad de Madrid' },
  Z: { name: 'Zaragoza', riskWeight: 0.25, region: 'Aragon' },
  TO: { name: 'Toledo', riskWeight: 0.35, region: 'Castilla-La Mancha' },
  AB: { name: 'Albacete', riskWeight: 0.4, region: 'Castilla-La Mancha' },
  CU: { name: 'Cuenca', riskWeight: 0.3, region: 'Castilla-La Mancha' },
  CR: { name: 'Ciudad Real', riskWeight: 0.3, region: 'Castilla-La Mancha' },
  GU: { name: 'Guadalajara', riskWeight: 0.25, region: 'Castilla-La Mancha' },

  // Low risk - interior provinces
  VA: { name: 'Valladolid', riskWeight: 0.2, region: 'Castilla y Leon' },
  SA: { name: 'Salamanca', riskWeight: 0.2, region: 'Castilla y Leon' },
  SG: { name: 'Segovia', riskWeight: 0.2, region: 'Castilla y Leon' },
  AV: { name: 'Avila', riskWeight: 0.2, region: 'Castilla y Leon' },
  BU: { name: 'Burgos', riskWeight: 0.25, region: 'Castilla y Leon' },
  LE: { name: 'Leon', riskWeight: 0.25, region: 'Castilla y Leon' },
  P: { name: 'Palencia', riskWeight: 0.2, region: 'Castilla y Leon' },
  SO: { name: 'Soria', riskWeight: 0.2, region: 'Castilla y Leon' },
  ZA: { name: 'Zamora', riskWeight: 0.2, region: 'Castilla y Leon' },
  LO: { name: 'La Rioja', riskWeight: 0.3, region: 'La Rioja' },
  NA: { name: 'Navarra', riskWeight: 0.35, region: 'Navarra' },
  TE: { name: 'Teruel', riskWeight: 0.25, region: 'Aragon' },
  HU_AR: { name: 'Huesca', riskWeight: 0.3, region: 'Aragon' },
  CC: { name: 'Caceres', riskWeight: 0.3, region: 'Extremadura' },
  BA: { name: 'Badajoz', riskWeight: 0.35, region: 'Extremadura' },
  LL: { name: 'Lleida', riskWeight: 0.3, region: 'Cataluna' },

  // Northern coast
  SS: { name: 'Gipuzkoa', riskWeight: 0.45, region: 'Pais Vasco' },
  BI: { name: 'Bizkaia', riskWeight: 0.45, region: 'Pais Vasco' },
  VI: { name: 'Araba', riskWeight: 0.3, region: 'Pais Vasco' },
  S: { name: 'Cantabria', riskWeight: 0.4, region: 'Cantabria' },
  O: { name: 'Asturias', riskWeight: 0.4, region: 'Asturias' },
  C: { name: 'A Coruna', riskWeight: 0.45, region: 'Galicia' },
  LU: { name: 'Lugo', riskWeight: 0.35, region: 'Galicia' },
  OR: { name: 'Ourense', riskWeight: 0.3, region: 'Galicia' },
  PO: { name: 'Pontevedra', riskWeight: 0.4, region: 'Galicia' },

  // Islands
  TF: { name: 'Santa Cruz de Tenerife', riskWeight: 0.4, region: 'Canarias' },
  GC: { name: 'Las Palmas', riskWeight: 0.4, region: 'Canarias' },
  CE: { name: 'Ceuta', riskWeight: 0.35, region: 'Ceuta' },
  ML: { name: 'Melilla', riskWeight: 0.35, region: 'Melilla' },
};
