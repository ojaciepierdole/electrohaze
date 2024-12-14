import type { TransformationRule } from '@/types/document-processing';
import { normalizeText } from '@/utils/text-formatting/core/normalization';

/**
 * Normalizuje numery adresowe
 */
function normalizeAddressNumbers(value: string): {
  building: string;
  unit: string | null;
} {
  // Usuń białe znaki i podziel po ukośniku
  const parts = value.trim().split('/');
  
  if (parts.length === 1) {
    return {
      building: parts[0],
      unit: null
    };
  }

  return {
    building: parts[0],
    unit: parts.slice(1).join('/')
  };
}

/**
 * Usuwa prefiksy ulicy
 */
function removeStreetPrefix(value: string): string {
  return value.replace(
    /^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO|OS|OS\.|OSIEDLE)\b\s*/i,
    ''
  );
}

/**
 * Formatuje kod pocztowy
 */
function formatPostalCode(value: string): string {
  // Usuń wszystkie białe znaki i formatuj jako XX-XXX
  const cleaned = value.replace(/\s+/g, '');
  if (cleaned.length === 5) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  return value;
}

/**
 * Reguły transformacji dla adresów
 */
export const addressRules: TransformationRule[] = [
  // Reguła dla numeru budynku z mieszkaniem
  {
    name: 'split_building_number',
    priority: 100,
    condition: (value, context) => {
      return context.field.endsWith('Building') && value.includes('/');
    },
    transform: (value, context) => {
      const { building, unit } = normalizeAddressNumbers(value);
      
      // Określ prefiks pola na podstawie sekcji
      const fieldPrefix = context.field.replace(/Building$/, '');
      
      return {
        value: normalizeText(building, { toUpper: true }),
        additionalFields: unit ? {
          [`${fieldPrefix}Unit`]: {
            value: normalizeText(unit, { toUpper: true }) || '',
            confidence: context.document[context.section][context.field].confidence
          }
        } : undefined,
        metadata: {
          originalValue: value,
          transformationType: 'address_split',
          splitType: 'building_unit'
        }
      };
    }
  },

  // Reguła dla ulicy
  {
    name: 'normalize_street',
    priority: 90,
    condition: (value, context) => context.field.endsWith('Street'),
    transform: (value) => {
      const withoutPrefix = removeStreetPrefix(value);
      return {
        value: normalizeText(withoutPrefix, { toUpper: true }),
        metadata: {
          originalValue: value,
          transformationType: 'street_normalization',
          removedPrefix: value !== withoutPrefix
        }
      };
    }
  },

  // Reguła dla kodu pocztowego
  {
    name: 'normalize_postal_code',
    priority: 90,
    condition: (value, context) => context.field.endsWith('PostalCode'),
    transform: (value) => {
      const formatted = formatPostalCode(value);
      return {
        value: formatted,
        metadata: {
          originalValue: value,
          transformationType: 'postal_code_normalization'
        }
      };
    }
  },

  // Reguła dla miasta
  {
    name: 'normalize_city',
    priority: 90,
    condition: (value, context) => context.field.endsWith('City'),
    transform: (value) => ({
      value: normalizeText(value, { toUpper: true }),
      metadata: {
        transformationType: 'city_normalization'
      }
    })
  },

  // Reguła dla numeru mieszkania
  {
    name: 'normalize_unit',
    priority: 90,
    condition: (value, context) => context.field.endsWith('Unit'),
    transform: (value) => ({
      value: normalizeText(value, { toUpper: true }),
      metadata: {
        transformationType: 'unit_normalization'
      }
    })
  }
]; 