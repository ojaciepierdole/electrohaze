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
  
  console.log(`[normalizeStreet] Przetwarzanie wartości: "${value}"`);
  
  // Usuń znaki nowej linii i nadmiarowe spacje
  let normalized = value.split('\n')[0].trim();
  
  // Usuń prefiksy ulicy przed konwersją na wielkie litery
  const prefixPattern = new RegExp(`^(${ADDRESS_PREFIXES.join('|')})\\s+`, 'i');
  const hasPrefix = prefixPattern.test(normalized);
  normalized = normalized.replace(prefixPattern, '');
  
  console.log(`[normalizeStreet] Po usunięciu prefiksu: "${normalized}" (miał prefix: ${hasPrefix})`);
  
  // Konwertuj na wielkie litery
  normalized = normalized.toUpperCase();
  
  // Usuń przecinki i kropki na końcu
  normalized = normalized.replace(/[,\.]+$/, '');
  
  console.log(`[normalizeStreet] Wynik końcowy: "${normalized}"`);
  return normalized || null;
}

export function normalizeAddressNumbers(value: string | null): { building: string | null; unit: string | null } {
  if (!value) return { building: null, unit: null };
  
  // Zachowaj oryginalny format, tylko usuń nadmiarowe białe znaki
  const normalized = value.trim().replace(/\s+/g, ' ');
  
  console.log(`[normalizeAddressNumbers] Przetwarzanie wartości: "${normalized}"`);
  
  // Wzorce dla różnych formatów numerów
  const patterns = [
    // Format z ukośnikiem: 4C/29 lub 4C/29A - zachowaj dokładnie taki format
    {
      pattern: /^(\d+[A-Z]?)\/(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[2],
        keepOriginal: true
      })
    },
    // Format ze spacją: 4C 29 lub 4C 29A - zamień na format z ukośnikiem
    {
      pattern: /^(\d+[A-Z]?)\s+(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[2],
        keepOriginal: false
      })
    },
    // Format z literą w numerze budynku i ukośnikiem: 4/C/29
    {
      pattern: /^(\d+)\/([A-Z])\/(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: `${match[1]}${match[2]}`,
        unit: match[3],
        keepOriginal: false
      })
    },
    // Format z literą w numerze budynku i spacjami: 4 C 29
    {
      pattern: /^(\d+)\s+([A-Z])\s+(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: `${match[1]}${match[2]}`,
        unit: match[3],
        keepOriginal: false
      })
    },
    // Format z oznaczeniem mieszkania: 123 m. 45 lub 123 m 45 lub 123 lok. 45
    {
      pattern: new RegExp(`^(\\d+[A-Z]?)\\s*(${BUILDING_UNIT_SEPARATORS.join('|')})\\s*(\\d+[A-Z]?)$`, 'i'),
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[3],
        keepOriginal: false
      })
    },
    // Format z podwójnym numerem budynku: 123/45/67
    {
      pattern: /^(\d+[A-Z]?\/\d+[A-Z]?)\/(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: match[2],
        keepOriginal: true
      })
    },
    // Format z podwójnym numerem budynku i spacjami: 123 45 67
    {
      pattern: /^(\d+[A-Z]?\s+\d+[A-Z]?)\s+(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1].replace(/\s+/g, '/'),
        unit: match[2],
        keepOriginal: false
      })
    },
    // Tylko numer budynku: 123 lub 123A
    {
      pattern: /^(\d+[A-Z]?)$/i,
      extract: (match: RegExpMatchArray) => ({
        building: match[1],
        unit: null,
        keepOriginal: true
      })
    }
  ];

  for (const { pattern, extract } of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const result = extract(match);
      console.log(`[normalizeAddressNumbers] Dopasowano wzorzec:`, {
        pattern: pattern.toString(),
        result: {
          building: result.building?.toUpperCase(),
          unit: result.unit?.toUpperCase(),
          keepOriginal: result.keepOriginal
        }
      });
      
      // Jeśli mamy zachować oryginalny format i mamy numer lokalu
      if (result.keepOriginal && result.unit) {
        return {
          building: result.building?.toUpperCase() || null,
          unit: result.unit?.toUpperCase() || null
        };
      }
      
      // W przeciwnym razie zwróć w standardowym formacie z ukośnikiem
      return {
        building: result.building?.toUpperCase() || null,
        unit: result.unit ? `${result.unit.toUpperCase()}` : null
      };
    }
  }

  // Jeśli nie pasuje do żadnego wzorca, zwróć całość jako numer budynku
  console.log(`[normalizeAddressNumbers] Nie znaleziono wzorca, używam całości jako numeru budynku:`, normalized);
  return {
    building: normalized.toUpperCase(),
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

  console.log(`[normalizeAddress] Przetwarzanie pola:`, field);

  // Jeśli to pole zawiera pełny adres (np. "UL GIEŁDOWA 4C/29")
  if (field.content.includes(' ')) {
    const components = splitAddressLine(field.content, prefix);
    const result = {
      ...emptyAddress,
      confidence: field.confidence
    };

    // Usuń prefix i zachowaj tylko nazwę ulicy
    const streetMatch = field.content.match(/^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO)\b\s+(.+?)(?:\s+\d|\s*$)/i);
    if (streetMatch) {
      result[`${prefix}Street`] = streetMatch[1].trim().toUpperCase();
    } else {
      result[`${prefix}Street`] = components[`${prefix}Street`];
    }

    // Zachowaj oryginalny format numeru z ukośnikiem
    const numberPart = field.content.match(/\s+(\d+.*?)$/);
    if (numberPart) {
      const { building, unit } = normalizeAddressNumbers(numberPart[1]);
      if (building && unit) {
        result[`${prefix}Building`] = building;
        result[`${prefix}Unit`] = unit;
      } else if (building) {
        result[`${prefix}Building`] = building;
      }
    }

    console.log(`[normalizeAddress] Po przetworzeniu pełnego adresu:`, result);
    return result;
  }
  
  // Jeśli to pojedyncze pole (np. samo "4C/29" lub sama ulica)
  const { building, unit } = normalizeAddressNumbers(field.content);
  const result = {
    ...emptyAddress,
    confidence: field.confidence
  };

  // Jeśli nie udało się sparsować numeru, traktuj jako ulicę (bez prefixu)
  if (!building && !unit) {
    const streetValue = field.content.replace(/^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO)\b\s+/i, '');
    result[`${prefix}Street`] = streetValue.toUpperCase();
  } else {
    if (building) {
      result[`${prefix}Building`] = building;
    }
    if (unit) {
      result[`${prefix}Unit`] = unit;
    }
  }

  console.log(`[normalizeAddress] Po przetworzeniu pojedynczego pola:`, result);
  return result;
}

export function splitAddressLine(addressLine: string, prefix: 'dp' | 'pa' | 'supplier' = 'dp'): AddressComponents {
  if (!addressLine) {
    return getEmptyAddressComponents();
  }

  console.log(`[splitAddressLine] Przetwarzanie linii adresu: "${addressLine}"`);
  
  // 1. Najpierw usuń prefiksy ulicy
  const withoutPrefix = addressLine.replace(/^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO)\b\s*/i, '');
  console.log(`[splitAddressLine] Po usunięciu prefiksu: "${withoutPrefix}"`);

  // 2. Znajdź ostatnią grupę cyfr (potencjalny numer)
  const streetNumberMatch = withoutPrefix.match(/^(.*?)(?:\s+(\d+.*?))?$/);
  if (!streetNumberMatch) {
    const result = getEmptyAddressComponents();
    result[`${prefix}Street`] = withoutPrefix.toUpperCase();
    return result;
  }

  const [_, streetName, numberPart] = streetNumberMatch;
  console.log(`[splitAddressLine] Znaleziono:`, { streetName, numberPart });

  // 3. Przetwórz nazwę ulicy
  const street = streetName.trim().toUpperCase();
  
  // 4. Przetwórz numer budynku i mieszkania
  const { building, unit } = numberPart ? normalizeAddressNumbers(numberPart) : { building: null, unit: null };
  
  console.log(`[splitAddressLine] Po przetworzeniu:`, { street, building, unit });

  const result = getEmptyAddressComponents();
  result[`${prefix}Street`] = street;
  if (building) {
    result[`${prefix}Building`] = building;
  }
  if (unit) {
    result[`${prefix}Unit`] = unit;
  }

  return result;
}

function getEmptyAddressComponents(): AddressComponents {
  return {
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
} 