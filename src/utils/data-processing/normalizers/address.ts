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
  
  // Wzorce dla różnych formatów numerów
  const patterns = [
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

  console.log(`[normalizeAddressNumbers] Przetwarzanie wartości: "${normalized}"`);

  for (const { pattern, extract } of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      const result = extract(match);
      console.log(`[normalizeAddressNumbers] Dopasowano wzorzec:`, { pattern: pattern.toString(), result });
      return result;
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
  options: ProcessingOptions = {}
): NormalizedAddress {
  const { confidenceThreshold = 0.3 } = options;
  
  if (!field?.content || (field.confidence < confidenceThreshold)) {
    return {
      street: null,
      building: null,
      unit: null,
      originalStreet: null,
      postalCode: null,
      city: null,
      confidence: 0
    };
  }

  // Zachowaj oryginalną wartość
  const originalStreet = field.content;
  
  // Jeśli to pole zawiera pełny adres (np. "UL GIEŁDOWA 4C/29")
  if (field.content.includes(' ')) {
    const components = splitAddressLine(field.content);
    return {
      ...components,
      originalStreet,
      postalCode: null,
      city: null,
      confidence: field.confidence
    };
  }
  
  // Jeśli to pojedyncze pole (np. samo "4C/29")
  const { building, unit } = normalizeAddressNumbers(field.content);
  return {
    street: null,
    building,
    unit,
    originalStreet,
    postalCode: null,
    city: null,
    confidence: field.confidence
  };
}

export function splitAddressLine(addressLine: string): AddressComponents {
  // Normalizuj ulicę
  const normalizedStreet = normalizeStreet(addressLine);
  if (!normalizedStreet) {
    return { street: null, building: null, unit: null };
  }

  // Znajdź ostatnią grupę cyfr (potencjalny numer)
  const streetNumberMatch = normalizedStreet.match(/^(.*?)\s+(\d+.*?)$/);
  if (!streetNumberMatch) {
    return { 
      street: normalizedStreet,
      building: null,
      unit: null
    };
  }

  const [_, streetName, numberPart] = streetNumberMatch;
  const { building, unit } = normalizeAddressNumbers(numberPart);

  return {
    street: streetName.trim(),
    building,
    unit
  };
} 