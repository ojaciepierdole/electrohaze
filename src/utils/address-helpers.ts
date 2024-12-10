import type { AddressSet } from '@/types/processing';

// Mapowanie pól z przedrostkiem "dp" na standardowe pola
const DP_FIELD_MAPPING: Record<string, keyof AddressSet> = {
  'dpFirstName': 'FirstName',
  'dpLastName': 'LastName',
  'dpStreet': 'Street',
  'dpBuilding': 'Building',
  'dpUnit': 'Unit',
  'dpCity': 'City',
  'dpPostalCode': 'PostalCode',
  'dpCompanyName': 'CompanyName'
};

// Mapowanie pól na polskie etykiety
const POLISH_LABELS: Record<string, string> = {
  // Dane nabywcy (bez prefiksów)
  'FirstName': 'Imię',
  'LastName': 'Nazwisko',
  'Street': 'Ulica',
  'Building': 'Budynek',
  'Unit': 'Lokal',
  'PostalCode': 'Kod pocztowy',
  'City': 'Miejscowość',

  // Punkt Poboru Energii
  'ppeNum': 'Numer PPE',
  'supplierName': 'Sprzedawca',
  'OSD_name': 'Dystrybutor',
  'OSD_region': 'Region',
  'ProductName': 'Produkt',
  'dpStreet': 'Ulica',
  'dpBuilding': 'Budynek',
  'dpUnit': 'Lokal',
  'dpPostalCode': 'Kod pocztowy',
  'dpCity': 'Miejscowość',
  'dpFirstName': 'Imię',
  'dpLastName': 'Nazwisko',

  // Informacje o zużyciu
  'Tariff': 'Taryfa',
  'InvoiceType': 'Typ dokumentu',
  'BillingStartDate': 'Okres od',
  'BillingEndDate': 'Okres do',
  'BilledUsage': 'Naliczone zużycie',
  'ReadingType': 'Typ odczytu',
  'Usage12m': 'Zużycie roczne',

  // Adres korespondencyjny
  'paTitle': 'Tytuł',
  'paFirstName': 'Imię',
  'paLastName': 'Nazwisko',
  'paStreet': 'Ulica',
  'paBuilding': 'Budynek',
  'paUnit': 'Lokal',
  'paPostalCode': 'Kod pocztowy',
  'paCity': 'Miejscowość'
};

function normalizeFieldName(field: string): string {
  // Usuń dwukropek jeśli istnieje
  const withoutColon = field.endsWith(':') ? field.slice(0, -1) : field;
  return withoutColon.replace(/^(dp|pa|ppe)/, ''); // Usuń prefiks jeśli istnieje
}

function getPolishLabel(field: string): string {
  // Usuń dwukropek jeśli istnieje
  const baseField = field.endsWith(':') ? field.slice(0, -1) : field;
  
  // Normalizuj nazwę pola (usuń prefiksy)
  const normalizedField = normalizeFieldName(baseField);
  
  // Zwróć polską etykietę lub oryginalną nazwę z dwukropkiem
  return POLISH_LABELS[normalizedField] || `${normalizedField}:`;
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
    const value = enriched[dpField as keyof AddressSet];
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
      enriched[dpField as keyof AddressSet] = standardValue;
    }
  }

  return enriched;
}

// Eksportujemy funkcję do pobierania polskich etykiet
export function getFieldLabel(fieldName: string): string {
  // Najpierw sprawdź czy pole ma bezpośrednie mapowanie w POLISH_LABELS
  if (fieldName in POLISH_LABELS) {
    return POLISH_LABELS[fieldName];
  }

  // Jeśli nie znaleziono mapowania, zwróć oryginalną nazwę pola
  return fieldName;
} 