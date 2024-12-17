import type { TransformationRule, TransformationContext, DocumentField } from '@/types/processing';
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
    description: 'Rozdziela pełne imię i nazwisko na oddzielne pola',
    priority: 100,
    condition: (value: string, context: TransformationContext) => {
      if (!context.section) return false;
      
      // Sprawdź czy pole zawiera spację i kończy się na FirstName lub LastName
      return value.includes(' ') && (
        context.section.endsWith('FirstName') || 
        context.section.endsWith('LastName')
      );
    },
    transform: (value: string, context: TransformationContext) => {
      const parts = value.split(/\s+/).filter(Boolean);
      if (parts.length !== 2) {
        return {
          value,
          content: value,
          confidence: context.confidence || 0.5,
          metadata: {
            fieldType: 'text',
            transformationType: 'unchanged',
            originalValue: value,
            source: 'person_transform',
            status: 'unchanged'
          }
        };
      }

      const [part1, part2] = parts;
      const { firstName, lastName } = splitPersonName(part1, part2);
      const confidence = context.confidence || 0.5;

      // Określ prefiks pola na podstawie sekcji
      const fieldPrefix = (context.section || '').replace(/(?:FirstName|LastName)$/, '');

      // Jeśli przetwarzamy pole FirstName
      if (context.section?.endsWith('FirstName')) {
        return {
          value: firstName,
          content: firstName,
          confidence,
          additionalFields: {
            [`${fieldPrefix}LastName`]: {
              value: lastName,
              confidence,
              metadata: {
                fieldType: 'name',
                transformationType: 'name_split',
                originalValue: value
              }
            }
          },
          metadata: {
            fieldType: 'name',
            transformationType: 'name_split',
            splitType: 'from_first_name',
            originalValue: value,
            source: 'person_transform',
            status: 'transformed'
          }
        };
      }

      // Jeśli przetwarzamy pole LastName
      if (context.section?.endsWith('LastName')) {
        return {
          value: lastName,
          content: lastName,
          confidence,
          additionalFields: {
            [`${fieldPrefix}FirstName`]: {
              value: firstName,
              confidence,
              metadata: {
                fieldType: 'name',
                transformationType: 'name_split',
                originalValue: value
              }
            }
          },
          metadata: {
            fieldType: 'name',
            transformationType: 'name_split',
            splitType: 'from_last_name',
            originalValue: value,
            source: 'person_transform',
            status: 'transformed'
          }
        };
      }

      return {
        value,
        content: value,
        confidence,
        metadata: {
          fieldType: 'text',
          transformationType: 'unchanged',
          originalValue: value,
          source: 'person_transform',
          status: 'unchanged'
        }
      };
    }
  },

  {
    name: 'normalize_first_name',
    description: 'Normalizuje format imienia (wielkie litery, usunięcie nadmiarowych spacji)',
    priority: 90,
    condition: (value: string, context: TransformationContext) => 
      context.section ? context.section.endsWith('FirstName') : false,
    transform: (value: string, context: TransformationContext) => ({
      value: normalizeText(value, { toUpper: true }) || value,
      content: normalizeText(value, { toUpper: true }) || value,
      confidence: context.confidence || 0.8,
      metadata: {
        fieldType: 'name',
        transformationType: 'name_normalization',
        originalValue: value,
        source: 'person_transform',
        status: 'normalized'
      }
    })
  },

  {
    name: 'normalize_last_name',
    description: 'Normalizuje format nazwiska (wielkie litery, usunięcie nadmiarowych spacji)',
    priority: 90,
    condition: (value: string, context: TransformationContext) => 
      context.section ? context.section.endsWith('LastName') : false,
    transform: (value: string, context: TransformationContext) => ({
      value: normalizeText(value, { toUpper: true }) || value,
      content: normalizeText(value, { toUpper: true }) || value,
      confidence: context.confidence || 0.8,
      metadata: {
        fieldType: 'name',
        transformationType: 'name_normalization',
        originalValue: value,
        source: 'person_transform',
        status: 'normalized'
      }
    })
  }
]; 