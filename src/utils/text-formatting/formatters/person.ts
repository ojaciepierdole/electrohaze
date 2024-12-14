import { normalizeText } from '../core/normalization';
import { isEmpty, isProperName, shouldProcessField } from '../core/validation';
import { TYPICAL_FIRST_NAMES, TYPICAL_LAST_NAMES } from '../dictionaries/names';
import type { FieldWithConfidence } from '../types';

/**
 * Sprawdza, czy tekst jest typowym imieniem
 */
export function isFirstName(name: string | null): boolean {
  if (!name) return false;
  const normalized = normalizeText(name, { toUpper: true });
  return normalized ? TYPICAL_FIRST_NAMES.has(normalized) : false;
}

/**
 * Sprawdza, czy tekst jest typowym nazwiskiem
 */
export function isLastName(name: string | null): boolean {
  if (!name) return false;
  const normalized = normalizeText(name, { toUpper: true });
  return normalized ? TYPICAL_LAST_NAMES.has(normalized) : false;
}

/**
 * Rozdziela pełne imię i nazwisko na części
 */
export function splitPersonName(fullName: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!fullName || isEmpty(fullName)) {
    return { firstName: null, lastName: null };
  }

  // Normalizuj tekst wejściowy
  const normalized = normalizeText(fullName, { toUpper: true });
  if (!normalized) {
    return { firstName: null, lastName: null };
  }

  // Rozdziel na części
  const parts = normalized.split(/\s+/);
  
  if (parts.length === 1) {
    // Jeśli jest tylko jedna część, sprawdź czy to imię czy nazwisko
    if (isFirstName(parts[0])) {
      return { firstName: parts[0], lastName: null };
    }
    return { firstName: null, lastName: parts[0] };
  }

  if (parts.length === 2) {
    const [part1, part2] = parts;
    console.log('Sprawdzanie części:', {
      part1: {
        value: part1,
        isFirstName: isFirstName(part1),
        isLastName: isLastName(part1)
      },
      part2: {
        value: part2,
        isFirstName: isFirstName(part2),
        isLastName: isLastName(part2)
      }
    });

    // W polskich dokumentach zazwyczaj najpierw jest nazwisko, potem imię
    // Sprawdź najpierw tę kolejność
    if (isLastName(part1) && isFirstName(part2)) {
      return { firstName: part2, lastName: part1 };
    }

    // Sprawdź odwrotną kolejność
    if (isFirstName(part1) && isLastName(part2)) {
      return { firstName: part1, lastName: part2 };
    }

    // Jeśli jedna część jest jednoznacznie rozpoznana jako imię
    if (isFirstName(part1) && !isLastName(part2)) {
      return { firstName: part1, lastName: part2 };
    }
    if (isFirstName(part2) && !isLastName(part1)) {
      return { firstName: part2, lastName: part1 };
    }

    // Jeśli jedna część jest jednoznacznie rozpoznana jako nazwisko
    if (isLastName(part1) && !isFirstName(part2)) {
      return { firstName: part2, lastName: part1 };
    }
    if (isLastName(part2) && !isFirstName(part1)) {
      return { firstName: part1, lastName: part2 };
    }

    // Jeśli nie można jednoznacznie określić, użyj domyślnej kolejności (nazwisko imię)
    return { firstName: part2, lastName: part1 };
  }

  // Dla więcej niż dwóch części
  // Najpierw spróbuj znaleźć imię
  for (let i = 0; i < parts.length; i++) {
    if (isFirstName(parts[i])) {
      const remainingParts = [...parts];
      remainingParts.splice(i, 1);
      return {
        firstName: parts[i],
        lastName: remainingParts.join(' ')
      };
    }
  }

  // Jeśli nie znaleziono imienia, spróbuj znaleźć nazwisko
  for (let i = 0; i < parts.length; i++) {
    if (isLastName(parts[i])) {
      const remainingParts = [...parts];
      remainingParts.splice(i, 1);
      return {
        firstName: remainingParts.join(' '),
        lastName: parts[i]
      };
    }
  }

  // Jeśli nie znaleziono lepszego dopasowania, użyj domyślnej kolejności (nazwisko imię)
  return {
    firstName: parts[parts.length - 1],
    lastName: parts.slice(0, -1).join(' ')
  };
}

/**
 * Łączy pola z różnych źródeł z uwzględnieniem pewności
 */
export function mergePersonFields(
  fields: Array<{
    field: FieldWithConfidence | undefined;
    weight?: number;
  }>,
  options: {
    confidenceThreshold?: number;
  } = {}
): FieldWithConfidence | undefined {
  const { confidenceThreshold = 0.3 } = options;

  // Filtruj pola poniżej progu pewności
  const validFields = fields
    .filter(({ field }) => shouldProcessField(field, confidenceThreshold))
    .sort((a, b) => {
      const confA = a.field?.confidence ?? 0;
      const confB = b.field?.confidence ?? 0;
      const weightA = a.weight ?? 1;
      const weightB = b.weight ?? 1;
      return (confB * weightB) - (confA * weightA);
    });

  if (validFields.length === 0) {
    return undefined;
  }

  // Użyj pola z najwyższą ważoną pewnością
  const bestField = validFields[0].field;
  if (!bestField) {
    return undefined;
  }

  return {
    content: normalizeText(bestField.content) ?? null,
    confidence: bestField.confidence
  };
} 