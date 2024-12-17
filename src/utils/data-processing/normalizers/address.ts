import { NormalizedAddress, ProcessingOptions } from '../types';
import { FieldWithConfidence } from '../../../types/common';
import { DocumentField } from '@/types/processing';
import {
  AddressPrefix,
  AddressStreetKey,
  AddressBuildingKey,
  AddressUnitKey,
  AddressComponents,
  AddressNormalizationOptions,
  AddressNormalizationResult,
  ADDRESS_CONSTANTS
} from '../../../types/address';

const {
  REMOVABLE_PREFIXES,
  PREFIX_MAPPINGS,
  BUILDING_UNIT_SEPARATORS
} = ADDRESS_CONSTANTS;

const PRESERVED_PREFIXES = Object.values(PREFIX_MAPPINGS);

/**
 * Tworzy obiekt DocumentField
 */
function createDocumentField(value: string | null, confidence: number = 1): DocumentField | null {
  if (!value) return null;
  
  return {
    content: value,
    confidence,
    metadata: {
      fieldType: 'address',
      transformationType: 'normalized'
    }
  };
}

export function getEmptyAddressComponents(): AddressComponents {
  return {
    dpStreet: null,
    dpBuilding: null,
    dpUnit: null,
    dpCity: null,
    dpPostalCode: null,
    dpFirstName: null,
    dpLastName: null,
    paStreet: null,
    paBuilding: null,
    paUnit: null,
    paCity: null,
    paPostalCode: null,
    paFirstName: null,
    paLastName: null,
    supplierStreet: null,
    supplierBuilding: null,
    supplierUnit: null,
    supplierCity: null,
    supplierPostalCode: null,
    supplierFirstName: null,
    supplierLastName: null
  };
}

export function normalizeStreet(street: string | null): string | null {
  if (!street) return null;

  console.log('[normalizeStreet] Przetwarzanie wartości:', street);

  // Usuń białe znaki z początku i końca
  let result = street.trim();

  // Zamień na wielkie litery
  result = result.toUpperCase();

  // Usuń kropki i przecinki na końcu
  result = result.replace(/[.,]+$/, '');

  // Sprawdź czy mamy prefix
  const prefixMatch = result.match(new RegExp(`^(${[...REMOVABLE_PREFIXES, ...Object.keys(PREFIX_MAPPINGS)].join('|')})\\b\\.?\\s*(.+)$`, 'i'));
  
  if (prefixMatch) {
    const [_, prefix, rest] = prefixMatch;
    const upperPrefix = prefix.toUpperCase().replace(/\.$/, '');
    
    // Jeśli to prefix do usunięcia
    if (REMOVABLE_PREFIXES.includes(upperPrefix as typeof REMOVABLE_PREFIXES[number])) {
      result = rest;
    }
    // Jeśli to prefix do zachowania
    else {
      // Znajdź pełną formę prefiksu
      for (const [key, value] of Object.entries(PREFIX_MAPPINGS)) {
        if (upperPrefix === key.replace(/\.$/, '')) {
          result = `${value} ${rest}`;
          break;
        }
      }
    }
  }

  // Usuń podwójne spacje
  result = result.replace(/\s+/g, ' ').trim();

  console.log('[normalizeStreet] Wynik końcowy:', result);
  return result;
}

export function normalizeAddressNumbers(value: string | null): { building: string | null; unit: string | null } {
  if (!value) {
    return { building: null, unit: null };
  }

  console.log('[normalizeAddressNumbers] Przetwarzanie wartości:', value);

  // Wzorce do dopasowania
  const patterns = [
    // Format z podwójnym ukośnikiem (np. 123/45/67)
    {
      pattern: /^(\d+[A-Z]?\/\d+[A-Z]?)\/(\d+[A-Z]?)$/i,
      result: (matches: RegExpMatchArray) => ({
        building: matches[1].toUpperCase(),
        unit: matches[2].toUpperCase(),
        keepOriginal: true
      })
    },
    // Format z literą w numerze budynku i ukośnikiem (np. 4/C/29)
    {
      pattern: /^(\d+)\/([A-Z])\/(\d+[A-Z]?)$/i,
      result: (matches: RegExpMatchArray) => ({
        building: `${matches[1]}${matches[2]}`.toUpperCase(),
        unit: matches[3].toUpperCase(),
        keepOriginal: false
      })
    },
    // Format z ukośnikiem (np. 4C/29)
    {
      pattern: /^(\d+[A-Z]?)\/(\d+[A-Z]?)$/i,
      result: (matches: RegExpMatchArray) => ({
        building: matches[1].toUpperCase(),
        unit: matches[2].toUpperCase(),
        keepOriginal: true
      })
    },
    // Format z oznaczeniem mieszkania (np. 123 m. 45)
    {
      pattern: /^(\d+[A-Z]?)\s*(m\.|m|lok\.|lok|mieszk\.|mieszk|\/)\s*(\d+[A-Z]?)$/i,
      result: (matches: RegExpMatchArray) => ({
        building: matches[1].toUpperCase(),
        unit: matches[3].toUpperCase(),
        keepOriginal: false
      })
    },
    // Format z literą (np. 4C)
    {
      pattern: /^(\d+[A-Z]?)$/i,
      result: (matches: RegExpMatchArray) => ({
        building: matches[1].toUpperCase(),
        unit: undefined,
        keepOriginal: true
      })
    }
  ];

  // Sprawdź każdy wzorzec
  for (const { pattern, result } of patterns) {
    const matches = value.match(pattern);
    if (matches) {
      const { building, unit, keepOriginal } = result(matches);
      console.log('[normalizeAddressNumbers] Dopasowano wzorzec:', { pattern: pattern.toString(), result: { building, unit, keepOriginal } });
      return { building, unit: unit || null };
    }
  }

  // Jeśli żaden wzorzec nie pasuje, użyj całej wartości jako numeru budynku
  console.log('[normalizeAddressNumbers] Nie znaleziono wzorca, używam całości jako numeru budynku:', value);
  return { building: value.toUpperCase(), unit: null };
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
  options: AddressNormalizationOptions = {},
  prefix: AddressPrefix = 'dp'
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
    const result = {
      ...emptyAddress,
      confidence: field.confidence
    };

    // Usuń prefix i zachowaj tylko nazwę ulicy
    const streetMatch = field.content.match(/^(?:${REMOVABLE_PREFIXES.join('|')}|${PRESERVED_PREFIXES.join('|')})\b\s+(.+?)(?:\s+\d|\s*$)/i);
    if (streetMatch) {
      // Sprawdź czy prefix jest w PRESERVED_PREFIXES
      const prefixStr = streetMatch[0].trim().toUpperCase();
      const preservedPrefix = PRESERVED_PREFIXES.find(p => prefixStr.startsWith(p));
      const streetPart = streetMatch[1].trim().toUpperCase();
      const streetKey = `${prefix}Street` as AddressStreetKey;
      result[streetKey] = createDocumentField(preservedPrefix ? `${preservedPrefix} ${streetPart}` : streetPart, field.confidence);
    }

    // Przetwórz numery
    const numbersMatch = field.content.match(/\d+[A-Z]?(?:\/\d+[A-Z]?)?$/i);
    if (numbersMatch) {
      const { building, unit } = normalizeAddressNumbers(numbersMatch[0]);
      const buildingKey = `${prefix}Building` as AddressBuildingKey;
      const unitKey = `${prefix}Unit` as AddressUnitKey;
      result[buildingKey] = createDocumentField(building, field.confidence);
      if (unit) {
        result[unitKey] = createDocumentField(unit, field.confidence);
      }
    }

    return result;
  }

  return emptyAddress;
}

export function splitAddressLine(line: string | null, prefix: AddressPrefix = 'dp'): AddressComponents {
  if (!line) {
    return getEmptyAddressComponents();
  }

  console.log('[splitAddressLine] Przetwarzanie linii adresu:', JSON.stringify(line));

  // Usuń białe znaki z początku i końca
  let processedLine = line.trim();

  // Zamień na wielkie litery
  processedLine = processedLine.toUpperCase();

  console.log('[splitAddressLine] Po usunięciu prefiksu:', processedLine);

  // Znajdź ostatnią grupę cyfr (numer)
  const numberMatch = processedLine.match(/\s+(\d+[A-Z]?(?:(?:\/|\s+(?:m\.|m|lok\.|lok|mieszk\.|mieszk)?\s*)\d+[A-Z]?)?)$/i);

  let streetName = processedLine;
  let numberPart = null;

  if (numberMatch) {
    streetName = processedLine.slice(0, numberMatch.index).trim();
    numberPart = numberMatch[1];
  }

  console.log('[splitAddressLine] Znaleziono:', { streetName, numberPart });

  // Normalizuj nazwę ulicy
  const normalizedStreet = normalizeStreet(streetName);

  // Normalizuj numer
  const normalizedNumbers = numberPart ? normalizeAddressNumbers(numberPart) : { building: null, unit: null };

  const result = getEmptyAddressComponents();
  const streetKey = `${prefix}Street` as AddressStreetKey;
  const buildingKey = `${prefix}Building` as AddressBuildingKey;
  const unitKey = `${prefix}Unit` as AddressUnitKey;

  result[streetKey] = normalizedStreet;
  result[buildingKey] = normalizedNumbers.building;
  result[unitKey] = normalizedNumbers.unit;

  console.log('[splitAddressLine] Po przetworzeniu:', result);
  return result;
} 