import type { AddressSet } from '@/types/processing';

// Mapowanie pól z przedrostkiem "dp" na standardowe pola
const DP_FIELD_MAPPING: Record<string, keyof AddressSet> = {
  // Pola z dwukropkiem
  'dpFirstName:': 'FirstName',
  'dpLastName:': 'LastName',
  'dpStreet:': 'Street',
  'dpBuilding:': 'Building',
  'dpUnit:': 'Unit',
  'dpCity:': 'City',
  'dpPostalCode:': 'PostalCode',
  // Warianty bez dwukropka
  'dpFirstName': 'FirstName',
  'dpLastName': 'LastName',
  'dpStreet': 'Street',
  'dpBuilding': 'Building',
  'dpUnit': 'Unit',
  'dpCity': 'City',
  'dpPostalCode': 'PostalCode',
  // Warianty z polskimi etykietami
  'Imię:': 'FirstName',
  'Nazwisko:': 'LastName',
  'Ulica:': 'Street',
  'Budynek:': 'Building',
  'Lokal:': 'Unit',
  'Miejscowość:': 'City',
  'Kod pocztowy:': 'PostalCode',
  'Nazwa firmy:': 'CompanyName'
};

// Mapowanie pól na ich etykiety w sekcji "Dane biznesowe"
const DP_LABEL_MAPPING: Record<string, string> = {
  // Standardowe pola dp
  'dpFirstName': 'Imię:',
  'dpLastName': 'Nazwisko:',
  'dpStreet': 'Ulica:',
  'dpBuilding': 'Budynek:',
  'dpUnit': 'Lokal:',
  'dpCity': 'Miejscowość:',
  'dpPostalCode': 'Kod pocztowy:',
  'dpCompanyName': 'Nazwa firmy:',
  // Pola z dwukropkiem
  'dpFirstName:': 'Imię:',
  'dpLastName:': 'Nazwisko:',
  'dpStreet:': 'Ulica:',
  'dpBuilding:': 'Budynek:',
  'dpUnit:': 'Lokal:',
  'dpCity:': 'Miejscowość:',
  'dpPostalCode:': 'Kod pocztowy:',
  'dpCompanyName:': 'Nazwa firmy:',
  // Polskie etykiety (dla spójności)
  'Imię:': 'Imię:',
  'Nazwisko:': 'Nazwisko:',
  'Ulica:': 'Ulica:',
  'Budynek:': 'Budynek:',
  'Lokal:': 'Lokal:',
  'Miejscowość:': 'Miejscowość:',
  'Kod pocztowy:': 'Kod pocztowy:',
  'Nazwa firmy:': 'Nazwa firmy:'
};

function normalizeFieldName(field: string): string {
  // Usuń dwukropek jeśli istnieje
  const withoutColon = field.endsWith(':') ? field.slice(0, -1) : field;
  
  // Mapowanie polskich nazw na pola dp
  const polishToDP: Record<string, string> = {
    'Imię': 'dpFirstName',
    'Nazwisko': 'dpLastName',
    'Ulica': 'dpStreet',
    'Budynek': 'dpBuilding',
    'Lokal': 'dpUnit',
    'Miejscowość': 'dpCity',
    'Kod pocztowy': 'dpPostalCode',
    'Nazwa firmy': 'dpCompanyName'
  };

  // Jeśli to polska nazwa, zamień na odpowiednik dp
  return polishToDP[withoutColon] || withoutColon;
}

function normalizeUnit(unit: string): string {
  // Usuń przedrostek "M" lub "m." i wszystkie spacje
  return unit.replace(/^[Mm]\.?\s*/, '').trim();
}

function findSplitConfirmationInOtherSets(
  data: AddressSet, 
  currentPrefix: string, 
  value: string
): { building?: string; unit?: string } | null {
  const prefixes = ['', 'pa', 'ppe'].filter(p => p !== currentPrefix);
  
  // Szukamy potwierdzenia w innych zestawach danych
  for (const prefix of prefixes) {
    const buildingField = `${prefix}Building` as keyof AddressSet;
    const unitField = `${prefix}Unit` as keyof AddressSet;
    
    const otherBuilding = data[buildingField] as string;
    const otherUnit = data[unitField] as string;
    
    if (otherBuilding && otherUnit) {
      // Sprawdzamy czy połączenie building/unit z innego zestawu
      // odpowiada naszej wartości do rozdzielenia
      const combined = `${otherBuilding}/${otherUnit}`.replace(/\s+/g, '');
      if (value.replace(/\s+/g, '') === combined) {
        return {
          building: otherBuilding,
          unit: otherUnit
        };
      }
    }
  }
  
  return null;
}

function parseAddressNumbers(
  value: string, 
  data: AddressSet, 
  currentPrefix: string
): { building: string; unit?: string } {
  const normalized = value.trim().replace(/\s+/g, '');
  
  // Najpierw sprawdzamy czy mamy potwierdzenie w innych zestawach danych
  const confirmation = findSplitConfirmationInOtherSets(data, currentPrefix, normalized);
  if (confirmation) {
    return {
      building: confirmation.building!,
      unit: confirmation.unit
    };
  }
  
  // Jeśli nie znaleziono potwierdzenia, używamy standardowej logiki
  if (!normalized.includes('/')) {
    return { building: normalized };
  }

  const parts = normalized.split('/');

  // Przypadek "20/22/15" - podwójny numer budynku i lokal
  if (parts.length === 3) {
    return {
      building: `${parts[0]}/${parts[1]}`,
      unit: parts[2]
    };
  }

  // Standardowy przypadek "10/15" - budynek i lokal
  if (parts.length === 2) {
    return {
      building: parts[0],
      unit: parts[1]
    };
  }

  return { building: value };
}

function copyDpFields(data: AddressSet): AddressSet {
  const enriched = { ...data };

  // Kopiujemy wartości z pól dp do standardowych pól
  for (const [dpField, standardField] of Object.entries(DP_FIELD_MAPPING)) {
    // Normalizujemy nazwę pola
    const normalizedField = normalizeFieldName(dpField);
    
    // Sprawdzamy wszystkie warianty pola
    const variants = [
      dpField,                    // Oryginalne pole
      `${normalizedField}:`,      // Z dwukropkiem
      normalizedField,            // Bez dwukropka
      DP_LABEL_MAPPING[dpField]   // Polski odpowiednik
    ];

    // Szukamy wartości w każdym wariancie pola
    let value: string | undefined;
    for (const variant of variants) {
      if (variant) {
        value = enriched[variant as keyof AddressSet];
        if (value) break;
      }
    }

    if (value && (!enriched[standardField] || enriched[standardField] === '')) {
      enriched[standardField] = value;
    }
  }

  return enriched;
}

export function normalizeAndSplitAddressNumbers(data: AddressSet): AddressSet {
  // Najpierw kopiujemy wartości z pól dp
  let enriched = copyDpFields(data);
  const prefixes = ['', 'pa', 'ppe'] as const;

  // Dla każdego prefiksu sprawdzamy i rozdzielamy numery
  for (const prefix of prefixes) {
    const buildingField = `${prefix}Building` as keyof AddressSet;
    const unitField = `${prefix}Unit` as keyof AddressSet;

    if (enriched[buildingField]) {
      const parsed = parseAddressNumbers(
        enriched[buildingField] as string,
        enriched,
        prefix
      );
      
      enriched[buildingField] = parsed.building;
      
      if (parsed.unit && (!enriched[unitField] || enriched[unitField] === '')) {
        enriched[unitField] = parsed.unit;
      }
    }

    // Sprawdzamy też pole Unit
    if (enriched[unitField]) {
      // Normalizujemy numer lokalu
      enriched[unitField] = normalizeUnit(enriched[unitField] as string);

      if (enriched[unitField].includes('/')) {
        const parsed = parseAddressNumbers(
          enriched[unitField] as string,
          enriched,
          prefix
        );
        
        if (!enriched[buildingField] || enriched[buildingField] === '') {
          enriched[buildingField] = parsed.building;
        }
        
        enriched[unitField] = parsed.unit || '';
      }
    }
  }

  // Na koniec kopiujemy znormalizowane wartości z powrotem do pól dp
  for (const [dpField, standardField] of Object.entries(DP_FIELD_MAPPING)) {
    const standardValue = enriched[standardField];
    if (standardValue) {
      // Aktualizujemy wszystkie warianty pola
      const normalizedField = normalizeFieldName(dpField);
      const polishLabel = DP_LABEL_MAPPING[normalizedField];

      if (polishLabel) {
        enriched[polishLabel as keyof AddressSet] = standardValue;
      }
      enriched[`${normalizedField}:` as keyof AddressSet] = standardValue;
      enriched[normalizedField as keyof AddressSet] = standardValue;
    }
  }

  return enriched;
}

// Eksportujemy mapowanie etykiet dla użycia w interfejsie
export const getDpFieldLabel = (field: string): string => {
  // Normalizujemy nazwę pola
  const normalizedField = normalizeFieldName(field);
  
  // Zwracamy polską etykietę lub oryginalną nazwę z dwukropkiem
  return DP_LABEL_MAPPING[normalizedField] || `${field}:`;
}; 