// Maps province letter codes to the INE municipality code of the provincial capital.
// Used as fallback when clicking at province level to fetch weather forecasts.
export const PROVINCE_CAPITALS: Record<string, string> = {
  VI: '01059',  // Vitoria-Gasteiz
  AB: '02003',  // Albacete
  A:  '03014',  // Alicante
  AL: '04013',  // Almería
  AV: '05019',  // Ávila
  BA: '06015',  // Badajoz
  PM: '07040',  // Palma
  B:  '08019',  // Barcelona
  BU: '09059',  // Burgos
  CC: '10037',  // Cáceres
  CA: '11012',  // Cádiz
  CS: '12040',  // Castellón
  CR: '13034',  // Ciudad Real
  CO: '14021',  // Córdoba
  C:  '15030',  // A Coruña
  CU: '16078',  // Cuenca
  GI: '17079',  // Girona
  GR: '18087',  // Granada
  GU: '19130',  // Guadalajara
  SS: '20069',  // San Sebastián
  HU: '21041',  // Huelva
  HU_AR: '22125', // Huesca
  J:  '23050',  // Jaén
  LE: '24089',  // León
  LL: '25120',  // Lleida
  LO: '26089',  // Logroño
  LU: '27028',  // Lugo
  M:  '28079',  // Madrid
  MA: '29067',  // Málaga
  MU: '30030',  // Murcia
  NA: '31201',  // Pamplona
  OR: '32054',  // Ourense
  O:  '33044',  // Oviedo
  P:  '34120',  // Palencia
  GC: '35016',  // Las Palmas de Gran Canaria
  PO: '36038',  // Pontevedra
  SA: '37274',  // Salamanca
  TF: '38038',  // Santa Cruz de Tenerife
  S:  '39075',  // Santander
  SG: '40194',  // Segovia
  SE: '41091',  // Sevilla
  SO: '42173',  // Soria
  T:  '43148',  // Tarragona
  TE: '44216',  // Teruel
  TO: '45168',  // Toledo
  V:  '46250',  // Valencia
  VA: '47186',  // Valladolid
  BI: '48020',  // Bilbao
  ZA: '49275',  // Zamora
  Z:  '50297',  // Zaragoza
  CE: '51001',  // Ceuta
  ML: '52001',  // Melilla
};
