import { FieldWithConfidence } from '@/types/processing';
import { splitPersonName } from '@/utils/text-formatting/person';
import { mergeFieldsWithConfidence } from '@/utils/text-formatting';

// Funkcja pomocnicza do tworzenia FieldWithConfidence
function createFieldWithConfidence(content: string | undefined | null, confidence: number, source: string): FieldWithConfidence | undefined {
  if (!content) return undefined;
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

// Funkcja do wzbogacania danych osobowych
export function enrichPersonData(
  mainData: { firstName?: FieldWithConfidence; lastName?: FieldWithConfidence; fullName?: FieldWithConfidence } | undefined,
  correspondenceData: { firstName?: FieldWithConfidence; lastName?: FieldWithConfidence } | undefined,
  options: {
    mainWeight?: number;
    correspondenceWeight?: number;
    confidenceThreshold?: number;
  } = {}
): { firstName?: FieldWithConfidence; lastName?: FieldWithConfidence } {
  const {
    mainWeight = 1,
    correspondenceWeight = 0.8,
    confidenceThreshold = 0.3
  } = options;

  // Jeśli mamy pełne imię i nazwisko, rozdziel je
  let splitMainName = undefined;
  if (mainData?.fullName?.content) {
    const { firstName, lastName } = splitPersonName(mainData.fullName.content);
    if (firstName && lastName) {
      splitMainName = {
        firstName: createFieldWithConfidence(firstName, mainData.fullName.confidence, 'fullName'),
        lastName: createFieldWithConfidence(lastName, mainData.fullName.confidence, 'fullName')
      };
    }
  }

  // Sprawdź czy mamy połączone imię i nazwisko w którymś z pól
  let splitFirstName = undefined;
  if (mainData?.firstName?.content?.includes(' ')) {
    const { firstName, lastName } = splitPersonName(mainData.firstName.content);
    if (firstName && lastName) {
      splitFirstName = {
        firstName: createFieldWithConfidence(firstName, mainData.firstName.confidence, 'firstName'),
        lastName: createFieldWithConfidence(lastName, mainData.firstName.confidence, 'firstName')
      };
    }
  }

  // Sprawdź czy mamy połączone imię i nazwisko w polu lastName
  let splitLastName = undefined;
  if (mainData?.lastName?.content?.includes(' ')) {
    const { firstName, lastName } = splitPersonName(mainData.lastName.content);
    if (firstName && lastName) {
      splitLastName = {
        firstName: createFieldWithConfidence(firstName, mainData.lastName.confidence, 'lastName'),
        lastName: createFieldWithConfidence(lastName, mainData.lastName.confidence, 'lastName')
      };
    }
  }

  // Wzbogać imię
  const mergedFirstName = mergeFieldsWithConfidence([
    { field: splitMainName?.firstName || splitFirstName?.firstName || splitLastName?.firstName || mainData?.firstName, weight: mainWeight },
    { field: correspondenceData?.firstName, weight: correspondenceWeight }
  ], { confidenceThreshold });

  // Wzbogać nazwisko
  const mergedLastName = mergeFieldsWithConfidence([
    { field: splitMainName?.lastName || splitFirstName?.lastName || splitLastName?.lastName || mainData?.lastName, weight: mainWeight },
    { field: correspondenceData?.lastName, weight: correspondenceWeight }
  ], { confidenceThreshold });

  return {
    firstName: mergedFirstName ? createFieldWithConfidence(mergedFirstName.content, mergedFirstName.confidence, 'merged') : undefined,
    lastName: mergedLastName ? createFieldWithConfidence(mergedLastName.content, mergedLastName.confidence, 'merged') : undefined
  };
} 