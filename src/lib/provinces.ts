export interface ProvinceInfo {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

export const PROVINCES: ProvinceInfo[] = [
  { code: '01', name: 'Araba/Álava', lat: 42.85, lng: -2.67 },
  { code: '02', name: 'Albacete', lat: 38.99, lng: -1.86 },
  { code: '03', name: 'Alicante', lat: 38.35, lng: -0.48 },
  { code: '04', name: 'Almería', lat: 36.83, lng: -2.46 },
  { code: '05', name: 'Ávila', lat: 40.66, lng: -4.70 },
  { code: '06', name: 'Badajoz', lat: 38.88, lng: -6.97 },
  { code: '07', name: 'Illes Balears', lat: 39.57, lng: 2.65 },
  { code: '08', name: 'Barcelona', lat: 41.39, lng: 2.17 },
  { code: '09', name: 'Burgos', lat: 42.34, lng: -3.70 },
  { code: '10', name: 'Cáceres', lat: 39.47, lng: -6.37 },
  { code: '11', name: 'Cádiz', lat: 36.53, lng: -6.29 },
  { code: '12', name: 'Castellón', lat: 39.99, lng: -0.03 },
  { code: '13', name: 'Ciudad Real', lat: 38.99, lng: -3.93 },
  { code: '14', name: 'Córdoba', lat: 37.88, lng: -4.77 },
  { code: '15', name: 'A Coruña', lat: 43.37, lng: -8.40 },
  { code: '16', name: 'Cuenca', lat: 40.07, lng: -2.14 },
  { code: '17', name: 'Girona', lat: 41.98, lng: 2.82 },
  { code: '18', name: 'Granada', lat: 37.18, lng: -3.60 },
  { code: '19', name: 'Guadalajara', lat: 40.63, lng: -3.17 },
  { code: '20', name: 'Gipuzkoa', lat: 43.32, lng: -1.98 },
  { code: '21', name: 'Huelva', lat: 37.26, lng: -6.95 },
  { code: '22', name: 'Huesca', lat: 42.14, lng: -0.41 },
  { code: '23', name: 'Jaén', lat: 37.77, lng: -3.79 },
  { code: '24', name: 'León', lat: 42.60, lng: -5.57 },
  { code: '25', name: 'Lleida', lat: 41.62, lng: 0.62 },
  { code: '26', name: 'La Rioja', lat: 42.47, lng: -2.45 },
  { code: '27', name: 'Lugo', lat: 43.01, lng: -7.56 },
  { code: '28', name: 'Madrid', lat: 40.42, lng: -3.70 },
  { code: '29', name: 'Málaga', lat: 36.72, lng: -4.42 },
  { code: '30', name: 'Murcia', lat: 37.98, lng: -1.13 },
  { code: '31', name: 'Navarra', lat: 42.82, lng: -1.64 },
  { code: '32', name: 'Ourense', lat: 42.34, lng: -7.86 },
  { code: '33', name: 'Asturias', lat: 43.36, lng: -5.85 },
  { code: '34', name: 'Palencia', lat: 42.01, lng: -4.53 },
  { code: '35', name: 'Las Palmas', lat: 28.10, lng: -15.41 },
  { code: '36', name: 'Pontevedra', lat: 42.43, lng: -8.64 },
  { code: '37', name: 'Salamanca', lat: 40.97, lng: -5.66 },
  { code: '38', name: 'Santa Cruz de Tenerife', lat: 28.47, lng: -16.25 },
  { code: '39', name: 'Cantabria', lat: 43.46, lng: -3.80 },
  { code: '40', name: 'Segovia', lat: 40.95, lng: -4.12 },
  { code: '41', name: 'Sevilla', lat: 37.39, lng: -5.98 },
  { code: '42', name: 'Soria', lat: 41.76, lng: -2.46 },
  { code: '43', name: 'Tarragona', lat: 41.12, lng: 1.25 },
  { code: '44', name: 'Teruel', lat: 40.35, lng: -1.11 },
  { code: '45', name: 'Toledo', lat: 39.86, lng: -4.02 },
  { code: '46', name: 'Valencia', lat: 39.47, lng: -0.38 },
  { code: '47', name: 'Valladolid', lat: 41.65, lng: -4.72 },
  { code: '48', name: 'Bizkaia', lat: 43.26, lng: -2.93 },
  { code: '49', name: 'Zamora', lat: 41.50, lng: -5.75 },
  { code: '50', name: 'Zaragoza', lat: 41.65, lng: -0.88 },
  { code: '51', name: 'Ceuta', lat: 35.89, lng: -5.32 },
  { code: '52', name: 'Melilla', lat: 35.29, lng: -2.94 },
];

export const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {};
for (const p of PROVINCES) PROVINCE_COORDS[p.code] = { lat: p.lat, lng: p.lng };
