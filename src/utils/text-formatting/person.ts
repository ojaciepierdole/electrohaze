import { TYPICAL_FIRST_NAMES, TYPICAL_LAST_NAMES } from './dictionaries/names';
import type { FieldWithConfidence } from './types';

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

  // Sprawdź każdą część pod kątem typowych imion i nazwisk
  let firstNameIndex = -1;
  let lastNameIndex = -1;

  parts.forEach((part, index) => {
    if (TYPICAL_FIRST_NAMES.has(part)) {
      firstNameIndex = index;
    }
    if (TYPICAL_LAST_NAMES.has(part)) {
      lastNameIndex = index;
    }
  });

  // Jeśli znaleźliśmy zarówno imię jak i nazwisko w słownikach
  if (firstNameIndex !== -1 && lastNameIndex !== -1) {
    return {
      firstName: parts[firstNameIndex],
      lastName: parts[lastNameIndex]
    };
  }

  // Jeśli znaleźliśmy tylko imię w słowniku
  if (firstNameIndex !== -1) {
    // Weź część po imieniu jako nazwisko
    const remainingParts = parts.filter((_, index) => index !== firstNameIndex);
    return {
      firstName: parts[firstNameIndex],
      lastName: remainingParts.join(' ')
    };
  }

  // Jeśli znaleźliśmy tylko nazwisko w słowniku
  if (lastNameIndex !== -1) {
    // Weź część przed nazwiskiem jako imię
    const remainingParts = parts.filter((_, index) => index !== lastNameIndex);
    return {
      firstName: remainingParts.join(' '),
      lastName: parts[lastNameIndex]
    };
  }

  // Jeśli nie znaleźliśmy w słownikach, użyj heurystyki:
  
  // 1. Sprawdź czy któraś część kończy się na -ski, -cki, -dzki (typowe końcówki nazwisk)
  const lastNamePattern = /(SKI|CKI|DZKI)$/;
  const lastNameByPattern = parts.findIndex(part => lastNamePattern.test(part));
  if (lastNameByPattern !== -1) {
    const remainingParts = parts.filter((_, index) => index !== lastNameByPattern);
    return {
      firstName: remainingParts.join(' '),
      lastName: parts[lastNameByPattern]
    };
  }

  // 2. Jeśli żadna z powyższych metod nie zadziałała, 
  // zachowaj domyślne zachowanie (ostatnia część to nazwisko)
  // ale dodaj ostrzeżenie w konsoli
  console.warn(
    `Nie można jednoznacznie określić imienia i nazwiska dla "${fullName}". ` +
    `Używam domyślnej heurystyki: ostatnia część jako nazwisko.`
  );
  
  const lastName = parts.pop()!;
  const firstName = parts.join(' ');

  return {
    firstName: firstName,
    lastName: lastName
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

  // Wzbogać imię
  const enrichedFirstName = mergeFieldsWithConfidence([
    { field: splitMainName?.firstName || mainFields?.firstName, weight: mainWeight },
    { field: correspondenceFields?.firstName, weight: correspondenceWeight },
    { field: deliveryFields?.firstName || splitDeliveryName?.firstName, weight: deliveryWeight }
  ], { confidenceThreshold });

  // Wzbogać nazwisko
  const enrichedLastName = mergeFieldsWithConfidence([
    { field: splitMainName?.lastName || mainFields?.lastName, weight: mainWeight },
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