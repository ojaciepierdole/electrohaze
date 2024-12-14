import type { FieldWithConfidence } from '../types';
import { normalizeText } from './normalization';

/**
 * Sprawdza, czy pole powinno być przetworzone na podstawie pewności
 */
export function shouldProcessField(
  field: FieldWithConfidence | null | undefined,
  confidenceThreshold: number = 0.3
): boolean {
  if (!field) return false;
  if (field.confidence === undefined || field.confidence === null) return true;
  return field.confidence >= confidenceThreshold;
}

/**
 * Sprawdza, czy tekst jest pusty lub składa się tylko z białych znaków
 */
export function isEmpty(text: string | null | undefined): boolean {
  if (!text) return true;
  return text.trim().length === 0;
}

/**
 * Sprawdza, czy tekst zawiera cyfry
 */
export function containsDigits(text: string | null): boolean {
  if (!text) return false;
  return /\d/.test(text);
}

/**
 * Sprawdza, czy tekst zawiera tylko litery
 */
export function containsOnlyLetters(text: string | null): boolean {
  if (!text) return false;
  const normalized = normalizeText(text, { normalizePolish: true });
  return /^[A-Z]+$/.test(normalized || '');
}

/**
 * Sprawdza, czy tekst zawiera polskie znaki
 */
export function containsPolishChars(text: string | null): boolean {
  if (!text) return false;
  return /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text);
}

/**
 * Sprawdza, czy tekst jest w formacie imienia (pierwsza wielka litera, reszta małe)
 */
export function isProperName(text: string | null): boolean {
  if (!text) return false;
  const normalized = normalizeText(text, { toUpper: false, removeSpecial: true });
  return /^[A-ZŁŚŹĆŃĄĘÓ][a-złśźćńąęó]*$/.test(normalized || '');
} 