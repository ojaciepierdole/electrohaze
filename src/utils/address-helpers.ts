import type { AddressSet } from '@/types/processing';

// Mapowanie pól na polskie etykiety
const POLISH_LABELS: Record<string, string> = {
  // Dane nabywcy (bez prefiksów)
  'FirstName': 'Imię',
  'LastName': 'Nazwisko',
  'CompanyName': 'Nazwa firmy',
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
  'Municipality': 'Gmina',
  'District': 'Powiat',
  'Province': 'Województwo',

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

export function copyFields(data: AddressSet): AddressSet {
  const enriched = { ...data };

  // Kopiujemy wartości między standardowymi polami a polami z prefiksami
  const prefixes = ['pa', 'ppe'] as const;
  const standardFields = ['Title', 'FirstName', 'LastName', 'Street', 'Building', 'Unit', 'City', 'PostalCode'] as const;

  for (const prefix of prefixes) {
    for (const field of standardFields) {
      const prefixedField = `${prefix}${field}` as keyof AddressSet;
      const standardField = field as keyof AddressSet;

      if (!enriched[standardField] && enriched[prefixedField]) {
        enriched[standardField] = enriched[prefixedField];
      } else if (!enriched[prefixedField] && enriched[standardField]) {
        enriched[prefixedField] = enriched[standardField];
      }
    }
  }

  return enriched;
}

function normalizeFieldName(field: string): string {
  return field.replace(/^(pa|ppe)/, '');
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

  // Jeśli mamy format "33/153" - traktujemy jako budynek/lokal
  if (parts.length === 2) {
    return {
      building: parts[0],
      unit: parts[1]
    };
  }

  // Przypadek "20/22/15" - podwójny numer budynku i lokal
  if (parts.length === 3) {
    return {
      building: `${parts[0]}/${parts[1]}`,
      unit: parts[2]
    };
  }

  return { building: value };
}

export function normalizeAndSplitAddressNumbers(data: AddressSet): AddressSet {
  // Najpierw kopiujemy wartości między polami
  const enriched = copyFields(data);
  const prefixes = ['', 'pa', 'ppe'] as const;
  
  // Dla każdego prefiksu
  for (const prefix of prefixes) {
    const buildingField = `${prefix}Building` as keyof AddressSet;
    const unitField = `${prefix}Unit` as keyof AddressSet;

    // Jeśli mamy numer budynku
    if (enriched[buildingField]) {
      const result = parseAddressNumbers(enriched[buildingField], enriched, prefix);
      enriched[buildingField] = result.building;
      if (result.unit) {
        enriched[unitField] = result.unit;
      }
    }
  }

  return enriched;
}

function findSplitConfirmationInOtherSets(
  data: AddressSet,
  currentPrefix: string,
  value: string
): { building?: string; unit?: string } | null {
  const prefixes = ['', 'pa', 'ppe'];
  const otherPrefixes = prefixes.filter(p => p !== currentPrefix);

  for (const prefix of otherPrefixes) {
    const buildingField = `${prefix}Building` as keyof AddressSet;
    const unitField = `${prefix}Unit` as keyof AddressSet;

    if (data[buildingField] && data[unitField]) {
      const combined = `${data[buildingField]}/${data[unitField]}`.replace(/\s+/g, '');
      if (combined === value) {
        return {
          building: data[buildingField],
          unit: data[unitField]
        };
      }
    }
  }

  return null;
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