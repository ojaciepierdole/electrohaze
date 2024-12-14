import type { TransformationRule } from '@/types/document-processing';
import { isFirstName, isLastName } from '@/utils/text-formatting/dictionaries/names';
import { normalizeText } from '@/utils/text-formatting/core/normalization';

/**
 * Rozdziela pełne imię i nazwisko na części
 */
function splitPersonName(part1: string, part2: string): {
  firstName: string;
  lastName: string;
} {
  const normalizedPart1 = normalizeText(part1, { toUpper: true }) || '';
  const normalizedPart2 = normalizeText(part2, { toUpper: true }) || '';

  console.log('Sprawdzanie części:', {
    part1: {
      value: normalizedPart1,
      isFirstName: isFirstName(normalizedPart1),
      isLastName: isLastName(normalizedPart1)
    },
    part2: {
      value: normalizedPart2,
      isFirstName: isFirstName(normalizedPart2),
      isLastName: isLastName(normalizedPart2)
    }
  });

  // W polskich dokumentach zazwyczaj najpierw jest nazwisko, potem imię
  if (isLastName(normalizedPart1) && isFirstName(normalizedPart2)) {
    return { firstName: normalizedPart2, lastName: normalizedPart1 };
  }

  // Sprawdź odwrotną kolejność
  if (isFirstName(normalizedPart1) && isLastName(normalizedPart2)) {
    return { firstName: normalizedPart1, lastName: normalizedPart2 };
  }

  // Jeśli jedna część jest jednoznacznie rozpoznana jako imię
  if (isFirstName(normalizedPart1) && !isLastName(normalizedPart2)) {
    return { firstName: normalizedPart1, lastName: normalizedPart2 };
  }
  if (isFirstName(normalizedPart2) && !isLastName(normalizedPart1)) {
    return { firstName: normalizedPart2, lastName: normalizedPart1 };
  }

  // Jeśli jedna część jest jednoznacznie rozpoznana jako nazwisko
  if (isLastName(normalizedPart1) && !isFirstName(normalizedPart2)) {
    return { firstName: normalizedPart2, lastName: normalizedPart1 };
  }
  if (isLastName(normalizedPart2) && !isFirstName(normalizedPart1)) {
    return { firstName: normalizedPart1, lastName: normalizedPart2 };
  }

  // Jeśli nie można jednoznacznie określić, użyj domyślnej kolejności (nazwisko imię)
  return { firstName: normalizedPart2, lastName: normalizedPart1 };
}

/**
 * Reguły transformacji dla danych osobowych
 */
export const personNameRules: TransformationRule[] = [
  {
    name: 'split_full_name',
    priority: 100,
    condition: (value, context) => {
      // Sprawdź czy pole zawiera spację i kończy się na FirstName lub LastName
      return value.includes(' ') && (
        context.field.endsWith('FirstName') || 
        context.field.endsWith('LastName')
      );
    },
    transform: (value, context) => {
      const parts = value.split(/\s+/).filter(Boolean);
      if (parts.length !== 2) return { value };

      const [part1, part2] = parts;
      const { firstName, lastName } = splitPersonName(part1, part2);

      // Określ prefiks pola na podstawie sekcji
      const fieldPrefix = context.field.replace(/(?:FirstName|LastName)$/, '');

      // Jeśli przetwarzamy pole FirstName
      if (context.field.endsWith('FirstName')) {
        return {
          value: firstName,
          additionalFields: {
            [`${fieldPrefix}LastName`]: {
              value: lastName,
              confidence: context.document[context.section][context.field].confidence
            }
          },
          metadata: {
            originalValue: value,
            transformationType: 'name_split',
            splitType: 'from_first_name'
          }
        };
      }

      // Jeśli przetwarzamy pole LastName
      if (context.field.endsWith('LastName')) {
        return {
          value: lastName,
          additionalFields: {
            [`${fieldPrefix}FirstName`]: {
              value: firstName,
              confidence: context.document[context.section][context.field].confidence
            }
          },
          metadata: {
            originalValue: value,
            transformationType: 'name_split',
            splitType: 'from_last_name'
          }
        };
      }

      return { value };
    }
  },

  {
    name: 'normalize_first_name',
    priority: 90,
    condition: (value, context) => context.field.endsWith('FirstName'),
    transform: (value) => ({
      value: normalizeText(value, { toUpper: true }) || value,
      metadata: {
        transformationType: 'name_normalization',
        fieldType: 'first_name'
      }
    })
  },

  {
    name: 'normalize_last_name',
    priority: 90,
    condition: (value, context) => context.field.endsWith('LastName'),
    transform: (value) => ({
      value: normalizeText(value, { toUpper: true }) || value,
      metadata: {
        transformationType: 'name_normalization',
        fieldType: 'last_name'
      }
    })
  }
]; 