import { AddressComponents, NormalizedAddress, ProcessingOptions, FieldWithConfidence } from '../types';

const ADDRESS_PREFIXES = [
  'UL', 'UL.', 'ULICA',
  'AL', 'AL.', 'ALEJA',
  'PL', 'PL.', 'PLAC',
  'OS', 'OS.', 'OSIEDLE',
  'RONDO'
] as const;

const BUILDING_UNIT_SEPARATORS = [
  'm.', 'm', 'lok.', 'lok', 'mieszk.', 'mieszk', '/'
] as const;

export function normalizeStreet(value: string | null): string | null {
  if (!value) return null;
  
  // Usuń znaki nowej linii i nadmiarowe spacje
  let normalized = value.split('\n')[0].trim();
  
  // Konwertuj na wielkie litery
  normalized = normalized.toUpperCase();
  
  // Usuń prefiksy ulicy
  const prefixPattern = new RegExp(`^(${ADDRESS_PREFIXES.join('|')})\\s+`, 'i');
  normalized = normalized.replace(prefixPattern, '');
  
  // Usuń przecinki i kropki na końcu
  normalized = normalized.replace(/[,\.]+$/, '');
  
  return normalized || null;
}

export function normalizeAddressNumbers(value: string | null): { building: string | null; unit: string | null } {
  if (!value) return { building: null, unit: null };
  
  const normalized = value.toUpperCase().trim();
  
  console.log(`[normalizeAddressNumbers] Przetwarzanie wartości: "${normalized}"`);
  
  // Wzorce dla różnych formatów numerów
  const patterns = [
    // 4C/29 - format z literą w numerze budynku
    {
      pattern: /^(\d+[A-Z])\/(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[2]
      })
    },
    // 123/45 lub 123A/45B - najpopularniejszy format
    {
      pattern: /^(\d+[A-Z]?)\/(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[2]
      })
    },
    // 123 m. 45 lub 123A m. 45B
    {
      pattern: new RegExp(`^(\\d+[A-Z]?)\\s*(${BUILDING_UNIT_SEPARATORS.join('|')})\\s*(\\d+[A-Z]?)$`, 'i'),
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[3]
      })
    },
    // 123/45/67 (podwójny numer budynku i mieszkanie)
    {
      pattern: /^(\d+[A-Z]?\/\d+[A-Z]?)\/(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[2]
      })
    },
    // Tylko numer budynku 123 lub 123A
    {
      pattern: /^(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: null
      })
    }
  ];

  for (const { pattern, extract } of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const result = extract(match);
      console.log(`[normalizeAddressNumbers] Dopasowano wzorzec:`, { pattern: pattern.toString(), result });
      return {
        building: result.building,
        unit: result.unit
      };
    }
  }

  // Jeśli nie pasuje do żadnego wzorca, spróbuj znaleźć jakikolwiek numer mieszkania
  const unitMatch = normalized.match(/\/(\d+[A-Z]?)$/i);
  if (unitMatch) {
    const unit = unitMatch[1];
    const building = normalized.substring(0, normalized.length - unit.length - 1);
    console.log(`[normalizeAddressNumbers] Znaleziono numer mieszkania:`, { building, unit });
    return {
      building: building || null,
      unit
    };
  }

  // Jeśli nadal nic nie pasuje, zwróć całość jako numer budynku
  console.log(`[normalizeAddressNumbers] Nie znaleziono numeru mieszkania, używam całości jako numeru budynku:`, normalized);
  return {
    building: normalized,
    unit: null
  };
}

export function normalizePostalCode(value: string | null): string | null {
  if (!value) return null;
  
  // Usuń wszystkie białe znaki
  const cleaned = value.replace(/\s+/g, '');
  
  // Sprawdź format XX-XXX
  if (/^\d{2}-?\d{3}$/.test(cleaned)) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(-3)}`;
  }
  
  return null;
}

export function normalizeCity(value: string | null): string | null {
  if (!value) return null;
  
  // Usuń znaki nowej linii i nadmiarowe spacje
  let normalized = value.split('\n')[0].trim();
  
  // Konwertuj na wielkie litery
  normalized = normalized.toUpperCase();
  
  // Usuń przecinki i kropki
  normalized = normalized.replace(/[,\.]+$/, '');
  
  return normalized || null;
}

export function normalizeAddress(
  field: FieldWithConfidence | undefined | null,
  options: ProcessingOptions = {},
  prefix: 'dp' | 'pa' | 'supplier' = 'dp'
): NormalizedAddress {
  const { confidenceThreshold = 0.3 } = options;
  
  const emptyAddress: NormalizedAddress = {
    dpFirstName: null,
    dpLastName: null,
    dpStreet: null,
    dpBuilding: null,
    dpUnit: null,
    dpPostalCode: null,
    dpCity: null,
    paFirstName: null,
    paLastName: null,
    paStreet: null,
    paBuilding: null,
    paUnit: null,
    paPostalCode: null,
    paCity: null,
    supplierFirstName: null,
    supplierLastName: null,
    supplierStreet: null,
    supplierBuilding: null,
    supplierUnit: null,
    supplierPostalCode: null,
    supplierCity: null,
    confidence: 0
  };
  
  if (!field?.content || (field.confidence < confidenceThreshold)) {
    return emptyAddress;
  }

  // Jeśli to pole zawiera pełny adres (np. "UL GIEŁDOWA 4C/29")
  if (field.content.includes(' ')) {
    const components = splitAddressLine(field.content, prefix);
    const result = {
      ...emptyAddress,
      confidence: field.confidence
    };

    if (components[`${prefix}Street`]) {
      result[`${prefix}Street`] = components[`${prefix}Street`];
    }
    if (components[`${prefix}Building`]) {
      result[`${prefix}Building`] = components[`${prefix}Building`];
    }
    if (components[`${prefix}Unit`]) {
      result[`${prefix}Unit`] = components[`${prefix}Unit`];
    }

    return result;
  }
  
  // Jeśli to pojedyncze pole (np. samo "4C/29")
  const { building, unit } = normalizeAddressNumbers(field.content);
  const result = {
    ...emptyAddress,
    confidence: field.confidence
  };

  if (building) {
    result[`${prefix}Building`] = building;
  }
  if (unit) {
    result[`${prefix}Unit`] = unit;
  }

  return result;
}

export function splitAddressLine(addressLine: string, prefix: 'dp' | 'pa' | 'supplier' = 'dp'): AddressComponents {
  // Normalizuj ulicę
  const normalizedStreet = normalizeStreet(addressLine);
  if (!normalizedStreet) {
    const emptyResult: AddressComponents = {
      dpFirstName: null,
      dpLastName: null,
      dpStreet: null,
      dpBuilding: null,
      dpUnit: null,
      dpPostalCode: null,
      dpCity: null,
      paFirstName: null,
      paLastName: null,
      paStreet: null,
      paBuilding: null,
      paUnit: null,
      paPostalCode: null,
      paCity: null,
      supplierFirstName: null,
      supplierLastName: null,
      supplierStreet: null,
      supplierBuilding: null,
      supplierUnit: null,
      supplierPostalCode: null,
      supplierCity: null
    };
    return emptyResult;
  }

  // Znajdź ostatnią grupę cyfr (potencjalny numer)
  const streetNumberMatch = normalizedStreet.match(/^(.*?)\s+(\d+.*?)$/);
  if (!streetNumberMatch) {
    const result: AddressComponents = {
      dpFirstName: null,
      dpLastName: null,
      dpStreet: null,
      dpBuilding: null,
      dpUnit: null,
      dpPostalCode: null,
      dpCity: null,
      paFirstName: null,
      paLastName: null,
      paStreet: null,
      paBuilding: null,
      paUnit: null,
      paPostalCode: null,
      paCity: null,
      supplierFirstName: null,
      supplierLastName: null,
      supplierStreet: null,
      supplierBuilding: null,
      supplierUnit: null,
      supplierPostalCode: null,
      supplierCity: null
    };
    result[`${prefix}Street`] = normalizedStreet;
    return result;
  }

  const [_, streetName, numberPart] = streetNumberMatch;
  const { building, unit } = normalizeAddressNumbers(numberPart);

  const result: AddressComponents = {
    dpFirstName: null,
    dpLastName: null,
    dpStreet: null,
    dpBuilding: null,
    dpUnit: null,
    dpPostalCode: null,
    dpCity: null,
    paFirstName: null,
    paLastName: null,
    paStreet: null,
    paBuilding: null,
    paUnit: null,
    paPostalCode: null,
    paCity: null,
    supplierFirstName: null,
    supplierLastName: null,
    supplierStreet: null,
    supplierBuilding: null,
    supplierUnit: null,
    supplierPostalCode: null,
    supplierCity: null
  };

  result[`${prefix}Street`] = streetName.trim();
  if (building) {
    result[`${prefix}Building`] = building;
  }
  if (unit) {
    result[`${prefix}Unit`] = unit;
  }

  return result;
} 