// Typy OSD w Polsce
export type OSDName = 
  | 'PGE Dystrybucja'
  | 'TAURON Dystrybucja'
  | 'ENEA Operator'
  | 'ENERGA-OPERATOR'
  | 'Stoen Operator';

// Regiony OSD
export type OSDRegion =
  // PGE Dystrybucja
  | 'Białystok' | 'Lublin' | 'Łódź-Miasto' | 'Łódź-Teren' 
  | 'Rzeszów' | 'Skarżysko-Kamienna' | 'Warszawa' | 'Zamość'
  // TAURON Dystrybucja
  | 'Bielsko-Biała' | 'Będzin' | 'Częstochowa' | 'Gliwice'
  | 'Jelenia Góra' | 'Kraków' | 'Legnica' | 'Opole' 
  | 'Tarnów' | 'Wałbrzych' | 'Wrocław'
  // ENEA Operator
  | 'Bydgoszcz' | 'Gorzów Wielkopolski' | 'Poznań' | 'Szczecin' | 'Zielona Góra'
  // ENERGA-OPERATOR
  | 'Gdańsk' | 'Kalisz' | 'Koszalin' | 'Olsztyn' | 'Płock' | 'Toruń';

// Interfejs dla informacji o OSD
interface OSDInfo {
  name: OSDName;
  region: OSDRegion;
}

// Mapowanie kodów pocztowych do OSD
export const postalCodeToOSD: { [key: string]: OSDInfo } = {
  // PGE Dystrybucja
  '15-16': { name: 'PGE Dystrybucja', region: 'Białystok' },
  '20-23': { name: 'PGE Dystrybucja', region: 'Lublin' },
  '90-91': { name: 'PGE Dystrybucja', region: 'Łódź-Miasto' },
  '93-94': { name: 'PGE Dystrybucja', region: 'Łódź-Miasto' },
  '95-99': { name: 'PGE Dystrybucja', region: 'Łódź-Teren' },
  '35-38': { name: 'PGE Dystrybucja', region: 'Rzeszów' },
  '26-29': { name: 'PGE Dystrybucja', region: 'Skarżysko-Kamienna' },
  '24-25': { name: 'PGE Dystrybucja', region: 'Zamość' },

  // TAURON Dystrybucja
  '43-44': { name: 'TAURON Dystrybucja', region: 'Bielsko-Biała' },
  '41-42': { name: 'TAURON Dystrybucja', region: 'Częstochowa' },
  '58-59': { name: 'TAURON Dystrybucja', region: 'Jelenia Góra' },
  '30-32': { name: 'TAURON Dystrybucja', region: 'Kraków' },
  '45-47': { name: 'TAURON Dystrybucja', region: 'Opole' },
  '33-34': { name: 'TAURON Dystrybucja', region: 'Tarnów' },
  '48-49': { name: 'TAURON Dystrybucja', region: 'Wałbrzych' },
  '50-57': { name: 'TAURON Dystrybucja', region: 'Wrocław' },

  // ENEA Operator
  '85-89': { name: 'ENEA Operator', region: 'Bydgoszcz' },
  '66-67': { name: 'ENEA Operator', region: 'Gorzów Wielkopolski' },
  '60-64': { name: 'ENEA Operator', region: 'Poznań' },
  '70-74': { name: 'ENEA Operator', region: 'Szczecin' },
  '65-68': { name: 'ENEA Operator', region: 'Zielona Góra' },

  // ENERGA-OPERATOR
  '80-84': { name: 'ENERGA-OPERATOR', region: 'Gdańsk' },
  '75-76': { name: 'ENERGA-OPERATOR', region: 'Koszalin' },
  '10-14': { name: 'ENERGA-OPERATOR', region: 'Olsztyn' },
  '9': { name: 'ENERGA-OPERATOR', region: 'Płock' },
  '77-79': { name: 'ENERGA-OPERATOR', region: 'Toruń' },

  // Stoen Operator (Warszawa)
  '00-04': { name: 'Stoen Operator', region: 'Warszawa' }
};

// Funkcja sprawdzająca czy kod pocztowy jest poprawny
export function isValidPostalCode(postalCode: string): boolean {
  return /^\d{2}-\d{3}$/.test(postalCode);
}

// Funkcja zwracająca informacje o OSD na podstawie kodu pocztowego
export function getOSDInfoByPostalCode(postalCode: string): OSDInfo | null {
  if (!isValidPostalCode(postalCode)) {
    return null;
  }

  const prefix = postalCode.substring(0, 2);
  const prefixNum = parseInt(prefix, 10);

  // Szukamy pasującego zakresu w słowniku
  for (const [range, osdInfo] of Object.entries(postalCodeToOSD)) {
    const [start, end] = range.split('-').map(n => parseInt(n, 10));
    if (end) {
      // Zakres kodów
      if (prefixNum >= start && prefixNum <= end) {
        return osdInfo;
      }
    } else {
      // Pojedynczy kod
      if (prefixNum === start) {
        return osdInfo;
      }
    }
  }

  return null;
}

// Funkcja pomocnicza do sprawdzania regionu OSD
export function isInOSDRegion(postalCode: string, osdName: OSDName, region: OSDRegion): boolean {
  const osdInfo = getOSDInfoByPostalCode(postalCode);
  return osdInfo !== null && osdInfo.name === osdName && osdInfo.region === region;
}

// Przykład użycia:
// const osdInfo = getOSDInfoByPostalCode('00-001');
// if (osdInfo) {
//   console.log(`OSD: ${osdInfo.name}, Region: ${osdInfo.region}`);
// }
// 
// const isWarsaw = isInOSDRegion('00-001', 'Stoen Operator', 'Warszawa'); // true