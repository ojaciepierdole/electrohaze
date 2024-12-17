import { DocumentField } from '@azure/ai-form-recognizer';

/**
 * Sprawdza czy pole ma wystarczającą pewność
 */
export function hasConfidence(field: DocumentField | undefined, threshold: number = 0.5): boolean {
  return field?.confidence !== undefined && field.confidence >= threshold;
}

/**
 * Sprawdza czy pole ma wartość
 */
export function hasValue(field: DocumentField | undefined): boolean {
  return field?.content !== undefined && field.content !== null && field.content !== '';
}

/**
 * Sprawdza czy pole jest puste
 */
export function isEmpty(field: DocumentField | undefined): boolean {
  return !hasValue(field);
}

/**
 * Sprawdza czy pole jest niepewne
 */
export function isUncertain(field: DocumentField | undefined, threshold: number = 0.5): boolean {
  return !hasConfidence(field, threshold);
}

/**
 * Sprawdza czy pole wymaga weryfikacji
 */
export function needsVerification(field: DocumentField | undefined, threshold: number = 0.5): boolean {
  return hasValue(field) && isUncertain(field, threshold);
}

/**
 * Sprawdza czy pole zawiera poprawny email
 */
export function isValidEmail(field: DocumentField | undefined): boolean {
  if (!field?.content) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(field.content);
}

/**
 * Sprawdza czy pole zawiera poprawny numer telefonu
 */
export function isValidPhone(field: DocumentField | undefined): boolean {
  if (!field?.content) return false;
  const phoneRegex = /^[\d\s+\-()]{9,}$/;
  return phoneRegex.test(field.content);
}

/**
 * Sprawdza czy pole zawiera poprawny kod pocztowy
 */
export function isValidPostalCode(field: DocumentField | undefined): boolean {
  if (!field?.content) return false;
  const postalCodeRegex = /^\d{2}-\d{3}$/;
  return postalCodeRegex.test(field.content);
}

/**
 * Sprawdza czy pole zawiera poprawny NIP
 */
export function isValidTaxId(field: DocumentField | undefined): boolean {
  if (!field?.content) return false;
  const taxIdRegex = /^\d{10}$/;
  return taxIdRegex.test(field.content);
}

/**
 * Sprawdza czy pole zawiera poprawny numer konta bankowego
 */
export function isValidBankAccount(field: DocumentField | undefined): boolean {
  if (!field?.content) return false;
  const bankAccountRegex = /^\d{26}$/;
  return bankAccountRegex.test(field.content);
}

/**
 * Sprawdza czy pole spełnia walidację
 */
export function validateField(
  field: DocumentField | undefined,
  options: {
    required?: boolean;
    minConfidence?: number;
    validator?: (field: DocumentField) => boolean;
  } = {}
): boolean {
  const { required = true, minConfidence = 0.5, validator } = options;

  // Sprawdź czy pole jest wymagane
  if (required && isEmpty(field)) {
    return false;
  }

  // Sprawdź pewność pola
  if (!hasConfidence(field, minConfidence)) {
    return false;
  }

  // Sprawdź dodatkową walidację
  if (validator && field && !validator(field)) {
    return false;
  }

  return true;
} 