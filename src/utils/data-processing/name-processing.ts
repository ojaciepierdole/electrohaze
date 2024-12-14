import { FieldWithConfidence } from '@/types/processing';
import { splitPersonName } from '@/utils/text-formatting/person';
import { mergeFieldsWithConfidence } from '@/utils/text-formatting';

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
        firstName: { content: firstName, confidence: mainData.fullName.confidence },
        lastName: { content: lastName, confidence: mainData.fullName.confidence }
      };
    }
  }

  // Sprawdź czy mamy połączone imię i nazwisko w którymś z pól
  let splitFirstName = undefined;
  if (mainData?.firstName?.content?.includes(' ')) {
    const { firstName, lastName } = splitPersonName(mainData.firstName.content);
    if (firstName && lastName) {
      splitFirstName = {
        firstName: { content: firstName, confidence: mainData.firstName.confidence },
        lastName: { content: lastName, confidence: mainData.firstName.confidence }
      };
    }
  }

  // Sprawdź czy mamy połączone imię i nazwisko w polu lastName
  let splitLastName = undefined;
  if (mainData?.lastName?.content?.includes(' ')) {
    const { firstName, lastName } = splitPersonName(mainData.lastName.content);
    if (firstName && lastName) {
      splitLastName = {
        firstName: { content: firstName, confidence: mainData.lastName.confidence },
        lastName: { content: lastName, confidence: mainData.lastName.confidence }
      };
    }
  }

  // Wzbogać imię
  const enrichedFirstName = mergeFieldsWithConfidence([
    { field: splitMainName?.firstName || splitFirstName?.firstName || splitLastName?.firstName || mainData?.firstName, weight: mainWeight },
    { field: correspondenceData?.firstName, weight: correspondenceWeight }
  ], { confidenceThreshold });

  // Wzbogać nazwisko
  const enrichedLastName = mergeFieldsWithConfidence([
    { field: splitMainName?.lastName || splitFirstName?.lastName || splitLastName?.lastName || mainData?.lastName, weight: mainWeight },
    { field: correspondenceData?.lastName, weight: correspondenceWeight }
  ], { confidenceThreshold });

  return {
    firstName: enrichedFirstName,
    lastName: enrichedLastName
  };
} 