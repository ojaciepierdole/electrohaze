import { TYPICAL_FIRST_NAMES, TYPICAL_LAST_NAMES } from './dictionaries/names';
import type { FieldWithConfidence } from './types';

// Funkcje pomocnicze do sprawdzania imion i nazwisk
function isTypicalFirstName(name: string): boolean {
  return TYPICAL_FIRST_NAMES.has(name.toUpperCase());
}

function isTypicalLastName(name: string): boolean {
  return TYPICAL_LAST_NAMES.has(name.toUpperCase());
}

// Funkcja do rozdzielania imienia i nazwiska
export function splitPersonName(fullName: string | null): {
  firstName: string | null;
  lastName: string | null;
} {
  if (!fullName) return { firstName: null, lastName: null };

  // Usuń nadmiarowe białe znaki
  const cleanedName = fullName.trim().toUpperCase();

  // Rozdziel po białych znakach
  const parts = cleanedName.split(/\s+/);

  if (parts.length === 0) {
    return { firstName: null, lastName: null };
  }

  if (parts.length === 1) {
    // Jeśli jest tylko jedna część, traktuj ją jako nazwisko
    return { firstName: null, lastName: parts[0] };
  }

  if (parts.length === 2) {
    const first = parts[0];
    const second = parts[1];

    // Sprawdź czy części pasują do słowników
    const isFirstFirstName = isTypicalFirstName(first);
    const isFirstLastName = isTypicalLastName(first);
    const isSecondFirstName = isTypicalFirstName(second);
    const isSecondLastName = isTypicalLastName(second);

    // Jeśli obie części są jednoznacznie rozpoznane
    if (isFirstFirstName && isSecondLastName) {
      return {
        firstName: first,
        lastName: second
      };
    }
    if (isFirstLastName && isSecondFirstName) {
      return {
        firstName: second,
        lastName: first
      };
    }

    // Jeśli tylko jedna część jest rozpoznana jako imię
    if (isFirstFirstName && !isSecondFirstName) {
      return {
        firstName: first,
        lastName: second
      };
    }
    if (!isFirstFirstName && isSecondFirstName) {
      return {
        firstName: second,
        lastName: first
      };
    }

    // Jeśli tylko jedna część jest rozpoznana jako nazwisko
    if (!isFirstLastName && isSecondLastName) {
      return {
        firstName: first,
        lastName: second
      };
    }
    if (isFirstLastName && !isSecondLastName) {
      return {
        firstName: second,
        lastName: first
      };
    }

    // Jeśli nie znaleźliśmy w słownikach, sprawdź wzorce
    const lastNamePattern = /(SKI|CKI|DZKI|AK|EK|UK|YK|CZYK)$/;
    if (lastNamePattern.test(second)) {
      return {
        firstName: first,
        lastName: second
      };
    }
    if (lastNamePattern.test(first)) {
      return {
        firstName: second,
        lastName: first
      };
    }

    // Jeśli nie znaleźliśmy żadnych wzorców, zakładamy że pierwsza część to imię
    // (bardziej typowa kolejność w polskich dokumentach)
    return {
      firstName: first,
      lastName: second
    };
  }

  // Jeśli mamy więcej części, spróbuj znaleźć imię i nazwisko w słownikach
  for (let i = 0; i < parts.length; i++) {
    if (isTypicalFirstName(parts[i])) {
      // Znaleźliśmy imię, reszta to prawdopodobnie nazwisko
      const firstName = parts[i];
      const remainingParts = [...parts];
      remainingParts.splice(i, 1);
      return {
        firstName: firstName,
        lastName: remainingParts.join(' ')
      };
    }
    if (isTypicalLastName(parts[i])) {
      // Znaleźliśmy nazwisko, reszta to prawdopodobnie imię/imiona
      const lastName = parts[i];
      const remainingParts = [...parts];
      remainingParts.splice(i, 1);
      return {
        firstName: remainingParts.join(' '),
        lastName: lastName
      };
    }
  }

  // Jeśli nie znaleźliśmy w słownikach, zakładamy że pierwsza część to imię
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

// Funkcja do wzbogacania danych osobowych
export function enrichPersonFields(
  mainFields: { firstName?: FieldWithConfidence; lastName?: FieldWithConfidence } | undefined,
  correspondenceFields: { firstName?: FieldWithConfidence; lastName?: FieldWithConfidence } | undefined,
  deliveryFields: { firstName?: FieldWithConfidence; lastName?: FieldWithConfidence; fullName?: FieldWithConfidence } | undefined,
  options: {
    mainWeight?: number;
    correspondenceWeight?: number;
    deliveryWeight?: number;
    confidenceThreshold?: number;
  } = {}
): { firstName?: FieldWithConfidence; lastName?: FieldWithConfidence } {
  const {
    mainWeight = 1,
    correspondenceWeight = 0.8,
    deliveryWeight = 0.8,
    confidenceThreshold = 0.3
  } = options;

  // Jeśli mamy pełne imię i nazwisko w jednym polu, rozdziel je
  let splitDeliveryName = undefined;
  if (deliveryFields?.fullName?.content) {
    const { firstName, lastName } = splitPersonName(deliveryFields.fullName.content);
    if (firstName && lastName) {
      splitDeliveryName = {
        firstName: { content: firstName, confidence: deliveryFields.fullName.confidence },
        lastName: { content: lastName, confidence: deliveryFields.fullName.confidence }
      };
    }
  }

  // Sprawdź czy mamy połączone imię i nazwisko w którymś z pól
  let splitMainName = undefined;
  if (mainFields?.firstName?.content?.includes(' ')) {
    const { firstName, lastName } = splitPersonName(mainFields.firstName.content);
    if (firstName && lastName) {
      splitMainName = {
        firstName: { content: firstName, confidence: mainFields.firstName.confidence },
        lastName: { content: lastName, confidence: mainFields.firstName.confidence }
      };
    }
  }

  // Sprawdź czy mamy połączone imię i nazwisko w polu lastName
  let splitMainLastName = undefined;
  if (mainFields?.lastName?.content?.includes(' ')) {
    const { firstName, lastName } = splitPersonName(mainFields.lastName.content);
    if (firstName && lastName) {
      splitMainLastName = {
        firstName: { content: firstName, confidence: mainFields.lastName.confidence },
        lastName: { content: lastName, confidence: mainFields.lastName.confidence }
      };
    }
  }

  // Wzbogać imię
  const enrichedFirstName = mergeFieldsWithConfidence([
    { field: splitMainName?.firstName || splitMainLastName?.firstName || mainFields?.firstName, weight: mainWeight },
    { field: correspondenceFields?.firstName, weight: correspondenceWeight },
    { field: deliveryFields?.firstName || splitDeliveryName?.firstName, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać nazwisko
  const enrichedLastName = mergeFieldsWithConfidence([
    { field: splitMainName?.lastName || splitMainLastName?.lastName || mainFields?.lastName, weight: mainWeight },
    { field: correspondenceFields?.lastName, weight: correspondenceWeight },
    { field: deliveryFields?.lastName || splitDeliveryName?.lastName, weight: deliveryWeight }
  ], { confidenceThreshold });

  return {
    firstName: enrichedFirstName,
    lastName: enrichedLastName
  };
}

// Funkcja do łączenia danych z różnych pól z uwzględnieniem pewności
export function mergeFieldsWithConfidence(
  fields: Array<{ field: FieldWithConfidence | undefined, weight?: number }>,
  options: {
    confidenceThreshold?: number;  // Próg pewności, poniżej którego pole jest ignorowane
    requireAllFields?: boolean;    // Czy wszystkie pola muszą być wypełnione
    customMergeStrategy?: (values: string[]) => string; // Własna strategia łączenia wartości
  } = {}
): FieldWithConfidence | undefined {
  const {
    confidenceThreshold = 0.3,  // Obniżamy domyślny próg
    requireAllFields = false,
    customMergeStrategy
  } = options;

  // Filtruj pola null/undefined i poniżej progu pewności
  const validFields = fields
    .filter(f => f.field?.content && f.field.confidence >= confidenceThreshold)
    .map(f => ({
      content: f.field!.content!.trim().toUpperCase(), // Normalizujemy wartości
      confidence: f.field!.confidence,
      weight: f.weight || 1
    }));

  // Jeśli wymagamy wszystkich pól i jakiegoś brakuje, zwróć undefined
  if (requireAllFields && validFields.length !== fields.length) {
    return undefined;
  }

  // Jeśli nie ma żadnych ważnych pól, zwróć undefined
  if (validFields.length === 0) {
    return undefined;
  }

  // Grupuj pola po wartości i oblicz sumę pewności * waga dla każdej grupy
  const groups = validFields.reduce((acc, field) => {
    const existing = acc.find(g => g.content === field.content);
    if (existing) {
      existing.fields.push(field);
      existing.weightedConfidence += field.confidence * field.weight;
      existing.totalWeight += field.weight;
    } else {
      acc.push({
        content: field.content,
        fields: [field],
        weightedConfidence: field.confidence * field.weight,
        totalWeight: field.weight
      });
    }
    return acc;
  }, [] as Array<{
    content: string;
    fields: Array<{ content: string; confidence: number; weight: number }>;
    weightedConfidence: number;
    totalWeight: number;
  }>);

  // Sortuj grupy po liczbie wystąpień i średniej ważonej pewności
  const sortedGroups = groups.sort((a, b) => {
    const aCount = a.fields.length;
    const bCount = b.fields.length;
    if (aCount !== bCount) return bCount - aCount;
    
    const aAvgConfidence = a.weightedConfidence / a.totalWeight;
    const bAvgConfidence = b.weightedConfidence / b.totalWeight;
    return bAvgConfidence - aAvgConfidence;
  });

  // Wybierz grupę z najwyższą liczbą wystąpień i najwyższą średnią ważoną pewnością
  const bestGroup = sortedGroups[0];
  const mergedFields = bestGroup.fields;

  // Jeśli jest własna strategia łączenia, użyj jej
  if (customMergeStrategy) {
    const mergedContent = customMergeStrategy(mergedFields.map(f => f.content));
    // Średnia ważona pewności wszystkich pól
    const totalWeight = mergedFields.reduce((sum, f) => sum + f.weight, 0);
    const weightedConfidence = mergedFields.reduce((sum, f) => sum + f.confidence * f.weight, 0) / totalWeight;

    return {
      content: mergedContent.toUpperCase(),
      confidence: weightedConfidence
    };
  }

  // Zwróć pole z najwyższą liczbą wystąpień i najwyższą pewnością * waga
  return {
    content: mergedFields[0].content.toUpperCase(),
    confidence: mergedFields[0].confidence
  };
}

// ... existing code ... 