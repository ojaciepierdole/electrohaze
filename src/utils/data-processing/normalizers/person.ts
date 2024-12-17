import type { FieldWithConfidence } from '@/types/processing';
import { splitPersonName, mergePersonFields } from '@/utils/text-formatting/formatters/person';
import { normalizeText } from '@/utils/text-formatting/core/normalization';
import { shouldProcessField } from '@/utils/text-formatting/core/validation';

// Funkcja pomocnicza do tworzenia FieldWithConfidence
function createFieldWithConfidence(content: string, confidence: number, source: string): FieldWithConfidence {
  return {
    content,
    confidence,
    metadata: {
      fieldType: 'text',
      transformationType: 'initial',
      source
    }
  };
}

/**
 * Normalizuje dane osobowe z jednego źródła
 */
export function normalizePersonData(data: {
  firstName?: FieldWithConfidence;
  lastName?: FieldWithConfidence;
  fullName?: FieldWithConfidence;
}): {
  firstName?: FieldWithConfidence;
  lastName?: FieldWithConfidence;
} {
  console.group('normalizePersonData');
  console.log('Dane wejściowe:', data);

  const result: {
    firstName?: FieldWithConfidence;
    lastName?: FieldWithConfidence;
  } = {};

  // Jeśli mamy pełne imię i nazwisko, rozdziel je
  if (data.fullName?.content) {
    console.log('Przetwarzanie pełnego imienia i nazwiska:', data.fullName.content);
    const { firstName, lastName } = splitPersonName(data.fullName.content);
    console.log('Wynik rozdzielenia:', { firstName, lastName });
    
    if (firstName) {
      result.firstName = createFieldWithConfidence(firstName, data.fullName.confidence, 'fullName');
    }
    if (lastName) {
      result.lastName = createFieldWithConfidence(lastName, data.fullName.confidence, 'fullName');
    }
  }

  // Sprawdź czy firstName zawiera pełne imię i nazwisko
  if (data.firstName?.content?.includes(' ')) {
    console.log('Przetwarzanie firstName zawierającego spację:', data.firstName.content);
    const { firstName, lastName } = splitPersonName(data.firstName.content);
    console.log('Wynik rozdzielenia firstName:', { firstName, lastName });
    
    if (firstName && lastName) {
      result.firstName = createFieldWithConfidence(firstName, data.firstName.confidence, 'firstName');
      if (!data.lastName?.content) {
        result.lastName = createFieldWithConfidence(lastName, data.firstName.confidence, 'firstName');
      }
    }
  }

  // Sprawdź czy lastName zawiera pełne imię i nazwisko
  if (data.lastName?.content?.includes(' ')) {
    console.log('Przetwarzanie lastName zawierającego spację:', data.lastName.content);
    const { firstName, lastName } = splitPersonName(data.lastName.content);
    console.log('Wynik rozdzielenia lastName:', { firstName, lastName });
    
    if (firstName && lastName) {
      if (!data.firstName?.content) {
        result.firstName = createFieldWithConfidence(firstName, data.lastName.confidence, 'lastName');
      }
      result.lastName = createFieldWithConfidence(lastName, data.lastName.confidence, 'lastName');
    }
  }

  // Jeśli mamy pojedyncze pola, użyj ich
  if (data.firstName?.content && !result.firstName) {
    console.log('Użycie pojedynczego firstName:', data.firstName.content);
    const normalizedFirstName = normalizeText(data.firstName.content);
    if (normalizedFirstName) {
      result.firstName = createFieldWithConfidence(
        normalizedFirstName,
        data.firstName.confidence,
        'firstName'
      );
    }
  }

  if (data.lastName?.content && !result.lastName) {
    console.log('Użycie pojedynczego lastName:', data.lastName.content);
    const normalizedLastName = normalizeText(data.lastName.content);
    if (normalizedLastName) {
      result.lastName = createFieldWithConfidence(
        normalizedLastName,
        data.lastName.confidence,
        'lastName'
      );
    }
  }

  console.log('Wynik końcowy:', result);
  console.groupEnd();

  return result;
}

/**
 * Łączy dane osobowe z różnych źródeł
 */
export function mergePersonData(
  mainData: {
    firstName?: FieldWithConfidence;
    lastName?: FieldWithConfidence;
    fullName?: FieldWithConfidence;
  } | undefined,
  correspondenceData: {
    firstName?: FieldWithConfidence;
    lastName?: FieldWithConfidence;
  } | undefined,
  options: {
    mainWeight?: number;
    correspondenceWeight?: number;
    confidenceThreshold?: number;
  } = {}
): {
  firstName?: FieldWithConfidence;
  lastName?: FieldWithConfidence;
} {
  const {
    mainWeight = 1,
    correspondenceWeight = 0.8,
    confidenceThreshold = 0.3
  } = options;

  // Normalizuj dane z głównego źródła
  const normalizedMain = mainData ? normalizePersonData(mainData) : undefined;

  // Normalizuj dane z adresu korespondencyjnego
  const normalizedCorrespondence = correspondenceData ? normalizePersonData(correspondenceData) : undefined;

  // Połącz imiona
  const firstName = mergePersonFields([
    { field: normalizedMain?.firstName, weight: mainWeight },
    { field: normalizedCorrespondence?.firstName, weight: correspondenceWeight }
  ], { confidenceThreshold });

  // Połącz nazwiska
  const lastName = mergePersonFields([
    { field: normalizedMain?.lastName, weight: mainWeight },
    { field: normalizedCorrespondence?.lastName, weight: correspondenceWeight }
  ], { confidenceThreshold });

  return {
    firstName,
    lastName
  };
} 