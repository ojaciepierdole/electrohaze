interface OSDInfo {
  name: string;
  region: string;
}

// Mapowanie kodów pocztowych na OSD
export const postalCodeToOSD: Record<string, OSDInfo> = {
  // STOEN OPERATOR (Warszawa)
  '00': { name: 'STOEN OPERATOR SP. Z O.O.', region: 'Warszawa' },
  '01': { name: 'STOEN OPERATOR SP. Z O.O.', region: 'Warszawa' },
  '02': { name: 'STOEN OPERATOR SP. Z O.O.', region: 'Warszawa' },
  '03': { name: 'STOEN OPERATOR SP. Z O.O.', region: 'Warszawa' },
  '04': { name: 'STOEN OPERATOR SP. Z O.O.', region: 'Warszawa' },

  // PGE DYSTRYBUCJA (Polska Wschodnia i Centralna)
  '08': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Lublin' },
  '20': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Lublin' },
  '21': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Lublin' },
  '22': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Lublin' },
  '23': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Lublin' },
  '24': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Lublin' },
  '26': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Skarżysko-Kamienna' },
  '27': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Skarżysko-Kamienna' },
  '28': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Skarżysko-Kamienna' },
  '15': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Rzeszów' },
  '16': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Rzeszów' },
  '37': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Rzeszów' },
  '38': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Rzeszów' },
  '39': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Rzeszów' },
  '05': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Warszawa' },
  '07': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Warszawa' },
  '96': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Łódź' },
  '97': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Łódź' },
  '98': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Łódź' },
  '99': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Łódź' },
  '18': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Białystok' },
  '19': { name: 'PGE DYSTRYBUCJA S.A.', region: 'Białystok' },

  // TAURON DYSTRYBUCJA (Polska Południowa)
  '30': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Kraków' },
  '31': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Kraków' },
  '32': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Kraków' },
  '33': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Bielsko-Biała' },
  '34': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Częstochowa' },
  '40': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Gliwice' },
  '41': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Gliwice' },
  '42': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Gliwice' },
  '43': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Gliwice' },
  '44': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Gliwice' },
  '45': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Opole' },
  '46': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Opole' },
  '47': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Opole' },
  '48': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Opole' },
  '49': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Opole' },
  '50': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '51': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '52': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '53': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '54': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '55': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '56': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '57': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Wrocław' },
  '58': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Jelenia Góra' },
  '59': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Jelenia Góra' },
  '67': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Legnica' },
  '68': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Legnica' },
  '69': { name: 'TAURON DYSTRYBUCJA S.A.', region: 'Legnica' },

  // ENEA OPERATOR (Polska Zachodnia)
  '60': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Poznań' },
  '61': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Poznań' },
  '62': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Poznań' },
  '63': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Poznań' },
  '64': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Poznań' },
  '65': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Poznań' },
  '66': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Zielona Góra' },
  '70': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Szczecin' },
  '71': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Szczecin' },
  '72': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Szczecin' },
  '73': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Szczecin' },
  '74': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Szczecin' },
  '75': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Gorzów Wielkopolski' },
  '76': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Gorzów Wielkopolski' },
  '85': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Bydgoszcz' },
  '86': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Bydgoszcz' },
  '87': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Bydgoszcz' },
  '88': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Bydgoszcz' },
  '89': { name: 'ENEA OPERATOR SP. Z O.O.', region: 'Bydgoszcz' },

  // ENERGA OPERATOR (Polska Północna)
  '80': { name: 'ENERGA OPERATOR S.A.', region: 'Gdańsk' },
  '81': { name: 'ENERGA OPERATOR S.A.', region: 'Gdańsk' },
  '82': { name: 'ENERGA OPERATOR S.A.', region: 'Gdańsk' },
  '83': { name: 'ENERGA OPERATOR S.A.', region: 'Gdańsk' },
  '84': { name: 'ENERGA OPERATOR S.A.', region: 'Gdańsk' },
  '10': { name: 'ENERGA OPERATOR S.A.', region: 'Olsztyn' },
  '11': { name: 'ENERGA OPERATOR S.A.', region: 'Olsztyn' },
  '12': { name: 'ENERGA OPERATOR S.A.', region: 'Olsztyn' },
  '13': { name: 'ENERGA OPERATOR S.A.', region: 'Olsztyn' },
  '14': { name: 'ENERGA OPERATOR S.A.', region: 'Olsztyn' },
  '06': { name: 'ENERGA OPERATOR S.A.', region: 'Płock' },
  '09': { name: 'ENERGA OPERATOR S.A.', region: 'Płock' }
};

// Funkcja do normalizacji nazwy OSD na podstawie kodu pocztowego
export function normalizeOSDName(postalCode: string): OSDInfo | null {
  if (!postalCode) return null;
  
  // Weź pierwsze dwie cyfry kodu pocztowego
  const prefix = postalCode.substring(0, 2);
  
  return postalCodeToOSD[prefix] || null;
}

// Funkcja sprawdzająca zgodność kodów pocztowych
export function arePostalCodesCompatible(code1?: string, code2?: string): boolean {
  if (!code1 || !code2) return false;
  
  // Porównaj pierwsze dwie cyfry kodów pocztowych
  return code1.substring(0, 2) === code2.substring(0, 2);
} 