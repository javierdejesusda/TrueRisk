export interface ProvinceEmergencyContacts {
  proteccionCivil?: string;
  bomberos?: string;
  policiaLocal?: string;
  hospital?: string;
}

// Real emergency phone numbers for all 52 Spanish provinces (INE codes).
// Sources: official municipal websites, Ayuntamiento directories, Paginas Amarillas,
// regional government portals, and hospital switchboard listings.
// For any emergency, the universal number 112 works nationwide.
export const EMERGENCY_CONTACTS: Record<string, ProvinceEmergencyContacts> = {
  // 01 - Alava (Vitoria-Gasteiz)
  '01': {
    proteccionCivil: '112',
    bomberos: '945 161 161',
    policiaLocal: '945 158 000',
    hospital: '945 007 000', // Hospital Universitario de Araba (Txagorritxu)
  },
  // 02 - Albacete
  '02': {
    proteccionCivil: '112',
    bomberos: '967 510 080',
    policiaLocal: '092',
    hospital: '967 597 100', // Complejo Hospitalario Universitario de Albacete
  },
  // 03 - Alicante
  '03': {
    proteccionCivil: '965 922 576',
    bomberos: '965 143 580',
    policiaLocal: '965 149 222',
    hospital: '965 938 300', // Hospital General Universitario de Alicante
  },
  // 04 - Almeria
  '04': {
    proteccionCivil: '950 237 755',
    bomberos: '950 621 048',
    policiaLocal: '092',
    hospital: '950 212 100', // Hospital Torrecardenas
  },
  // 05 - Avila
  '05': {
    proteccionCivil: '920 354 035',
    bomberos: '920 211 080',
    policiaLocal: '920 352 424',
    hospital: '920 358 000', // Hospital Nuestra Senora de Sonsoles
  },
  // 06 - Badajoz
  '06': {
    proteccionCivil: '924 286 970',
    bomberos: '924 286 970',
    policiaLocal: '924 210 206',
    hospital: '924 218 100', // Hospital Infanta Cristina
  },
  // 07 - Illes Balears (Palma)
  '07': {
    proteccionCivil: '112',
    bomberos: '971 774 100',
    policiaLocal: '971 281 600',
    hospital: '971 175 000', // Hospital Universitario Son Espases
  },
  // 08 - Barcelona
  '08': {
    proteccionCivil: '934 850 303',
    bomberos: '932 915 380',
    policiaLocal: '933 441 300', // Guardia Urbana
    hospital: '932 275 400', // Hospital Clinic
  },
  // 09 - Burgos
  '09': {
    proteccionCivil: '112',
    bomberos: '947 288 834',
    policiaLocal: '947 288 834',
    hospital: '947 281 800', // Hospital Universitario de Burgos
  },
  // 10 - Caceres
  '10': {
    proteccionCivil: '927 214 900',
    bomberos: '927 224 080',
    policiaLocal: '092',
    hospital: '927 256 200', // Hospital San Pedro de Alcantara
  },
  // 11 - Cadiz
  '11': {
    proteccionCivil: '956 241 147',
    bomberos: '956 227 050',
    policiaLocal: '956 241 100',
    hospital: '956 002 100', // Hospital Puerta del Mar
  },
  // 12 - Castellon
  '12': {
    proteccionCivil: '964 220 500',
    bomberos: '964 221 080',
    policiaLocal: '964 355 400',
    hospital: '964 726 500', // Hospital General Universitario de Castellon
  },
  // 13 - Ciudad Real
  '13': {
    proteccionCivil: '926 230 431',
    bomberos: '926 230 431',
    policiaLocal: '926 230 422',
    hospital: '926 278 000', // Hospital General de Ciudad Real
  },
  // 14 - Cordoba
  '14': {
    proteccionCivil: '957 233 753',
    bomberos: '957 233 753',
    policiaLocal: '092',
    hospital: '957 217 000', // Hospital Reina Sofia
  },
  // 15 - A Coruna
  '15': {
    proteccionCivil: '112',
    bomberos: '981 134 450',
    policiaLocal: '881 048 603',
    hospital: '981 178 000', // CHUAC
  },
  // 16 - Cuenca
  '16': {
    proteccionCivil: '969 222 511',
    bomberos: '969 221 080',
    policiaLocal: '969 224 859',
    hospital: '969 179 900', // Hospital Virgen de la Luz
  },
  // 17 - Girona
  '17': {
    proteccionCivil: '112',
    bomberos: '972 940 250',
    policiaLocal: '092',
    hospital: '972 940 200', // Hospital Josep Trueta
  },
  // 18 - Granada
  '18': {
    proteccionCivil: '958 246 907',
    bomberos: '958 246 900',
    policiaLocal: '958 248 100',
    hospital: '958 020 000', // Hospital Virgen de las Nieves
  },
  // 19 - Guadalajara
  '19': {
    proteccionCivil: '949 880 112',
    bomberos: '949 247 280',
    policiaLocal: '092',
    hospital: '949 209 200', // Hospital Universitario de Guadalajara
  },
  // 20 - Gipuzkoa (Donostia-San Sebastian)
  '20': {
    proteccionCivil: '943 469 991',
    bomberos: '943 455 580',
    policiaLocal: '943 450 000',
    hospital: '943 007 000', // Hospital Universitario Donostia
  },
  // 21 - Huelva
  '21': {
    proteccionCivil: '112',
    bomberos: '959 210 508',
    policiaLocal: '092',
    hospital: '959 016 000', // Hospital Juan Ramon Jimenez
  },
  // 22 - Huesca
  '22': {
    proteccionCivil: '974 221 540',
    bomberos: '974 220 000',
    policiaLocal: '974 223 000',
    hospital: '974 211 121', // Hospital San Jorge
  },
  // 23 - Jaen
  '23': {
    proteccionCivil: '953 295 993',
    bomberos: '953 276 890',
    policiaLocal: '953 276 890',
    hospital: '953 008 000', // Complejo Hospitalario de Jaen
  },
  // 24 - Leon
  '24': {
    proteccionCivil: '987 222 252',
    bomberos: '987 216 080',
    policiaLocal: '987 255 500',
    hospital: '987 237 400', // Complejo Asistencial Universitario de Leon
  },
  // 25 - Lleida
  '25': {
    proteccionCivil: '112',
    bomberos: '973 700 600',
    policiaLocal: '973 234 340',
    hospital: '973 705 200', // Hospital Arnau de Vilanova
  },
  // 26 - La Rioja (Logrono)
  '26': {
    proteccionCivil: '112',
    bomberos: '941 225 599',
    policiaLocal: '941 235 011',
    hospital: '941 298 000', // Hospital San Pedro
  },
  // 27 - Lugo
  '27': {
    proteccionCivil: '112',
    bomberos: '982 297 482',
    policiaLocal: '982 297 110',
    hospital: '982 296 000', // HULA - Hospital Lucus Augusti
  },
  // 28 - Madrid
  '28': {
    proteccionCivil: '915 373 100',
    bomberos: '914 002 222',
    policiaLocal: '092',
    hospital: '913 368 000', // Hospital Ramon y Cajal
  },
  // 29 - Malaga
  '29': {
    proteccionCivil: '952 214 733',
    bomberos: '951 926 160',
    policiaLocal: '952 126 500',
    hospital: '951 290 000', // Hospital Regional de Malaga (Carlos Haya)
  },
  // 30 - Murcia
  '30': {
    proteccionCivil: '968 229 500',
    bomberos: '968 229 350',
    policiaLocal: '968 358 600',
    hospital: '968 369 500', // Hospital Virgen de la Arrixaca
  },
  // 31 - Navarra (Pamplona)
  '31': {
    proteccionCivil: '948 012 012',
    bomberos: '948 012 012',
    policiaLocal: '948 420 100',
    hospital: '848 422 222', // Complejo Hospitalario de Navarra
  },
  // 32 - Ourense
  '32': {
    proteccionCivil: '988 510 254',
    bomberos: '988 371 313',
    policiaLocal: '988 388 138',
    hospital: '988 385 500', // CHUO
  },
  // 33 - Asturias (Oviedo)
  '33': {
    proteccionCivil: '985 238 292',
    bomberos: '985 211 999',
    policiaLocal: '985 111 477',
    hospital: '985 108 000', // HUCA
  },
  // 34 - Palencia
  '34': {
    proteccionCivil: '979 752 011',
    bomberos: '979 718 200',
    policiaLocal: '979 718 200',
    hospital: '979 167 000', // Hospital General Rio Carrion
  },
  // 35 - Las Palmas
  '35': {
    proteccionCivil: '928 361 444',
    bomberos: '928 446 444',
    policiaLocal: '928 446 707',
    hospital: '928 444 000', // Hospital Universitario Insular de Gran Canaria
  },
  // 36 - Pontevedra
  '36': {
    proteccionCivil: '112',
    bomberos: '986 833 291',
    policiaLocal: '986 833 080',
    hospital: '986 800 000', // Hospital Montecelo (CHUP)
  },
  // 37 - Salamanca
  '37': {
    proteccionCivil: '923 759 000',
    bomberos: '923 232 080',
    policiaLocal: '092',
    hospital: '923 291 100', // Hospital Clinico Universitario
  },
  // 38 - Santa Cruz de Tenerife
  '38': {
    proteccionCivil: '922 606 060',
    bomberos: '922 533 487',
    policiaLocal: '092',
    hospital: '922 602 000', // Hospital Universitario Ntra. Sra. de Candelaria
  },
  // 39 - Cantabria (Santander)
  '39': {
    proteccionCivil: '942 208 258',
    bomberos: '942 200 828',
    policiaLocal: '942 200 615',
    hospital: '942 202 520', // Hospital Universitario Marques de Valdecilla
  },
  // 40 - Segovia
  '40': {
    proteccionCivil: '921 759 000',
    bomberos: '921 419 199',
    policiaLocal: '921 431 212',
    hospital: '921 419 100', // Hospital General de Segovia
  },
  // 41 - Sevilla
  '41': {
    proteccionCivil: '954 234 040',
    bomberos: '955 010 080',
    policiaLocal: '954 615 324',
    hospital: '955 012 000', // Hospital Virgen del Rocio
  },
  // 42 - Soria
  '42': {
    proteccionCivil: '975 759 000',
    bomberos: '975 759 000',
    policiaLocal: '092',
    hospital: '975 234 300', // Hospital Santa Barbara
  },
  // 43 - Tarragona
  '43': {
    proteccionCivil: '112',
    bomberos: '977 549 959',
    policiaLocal: '092',
    hospital: '977 295 800', // Hospital Joan XXIII
  },
  // 44 - Teruel
  '44': {
    proteccionCivil: '978 969 000',
    bomberos: '978 604 080',
    policiaLocal: '978 619 901',
    hospital: '978 621 150', // Hospital General Obispo Polanco
  },
  // 45 - Toledo
  '45': {
    proteccionCivil: '112',
    bomberos: '925 269 717',
    policiaLocal: '925 330 500',
    hospital: '925 269 200', // Hospital Virgen de la Salud
  },
  // 46 - Valencia
  '46': {
    proteccionCivil: '962 084 927',
    bomberos: '963 473 473',
    policiaLocal: '963 525 478',
    hospital: '961 244 000', // Hospital La Fe
  },
  // 47 - Valladolid
  '47': {
    proteccionCivil: '983 426 450',
    bomberos: '983 413 075',
    policiaLocal: '092',
    hospital: '983 420 000', // Hospital Clinico Universitario
  },
  // 48 - Bizkaia (Bilbao)
  '48': {
    proteccionCivil: '944 203 132',
    bomberos: '944 204 950',
    policiaLocal: '944 205 000',
    hospital: '944 006 000', // Hospital de Basurto
  },
  // 49 - Zamora
  '49': {
    proteccionCivil: '112',
    bomberos: '980 558 006',
    policiaLocal: '092',
    hospital: '980 548 200', // Hospital Virgen de la Concha
  },
  // 50 - Zaragoza
  '50': {
    proteccionCivil: '976 721 669',
    bomberos: '976 721 669',
    policiaLocal: '092',
    hospital: '976 765 500', // Hospital Miguel Servet
  },
  // 51 - Ceuta
  '51': {
    proteccionCivil: '956 512 523',
    bomberos: '956 528 239',
    policiaLocal: '956 526 994',
    hospital: '856 907 000', // Hospital Universitario de Ceuta
  },
  // 52 - Melilla
  '52': {
    proteccionCivil: '952 698 129',
    bomberos: '952 674 100',
    policiaLocal: '952 698 100',
    hospital: '952 670 000', // Hospital Comarcal de Melilla
  },
};

export function getContacts(provinceCode: string): ProvinceEmergencyContacts {
  return EMERGENCY_CONTACTS[provinceCode] ?? {};
}
