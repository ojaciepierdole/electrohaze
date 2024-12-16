import { TextProcessingOptions } from '@/types/processing';

/**
 * Normalizuje tekst według podanych opcji
 */
export function normalizeText(
  text: string | null | undefined,
  options: TextProcessingOptions = {}
): string {
  if (!text) return '';

  const {
    trim = true,
    toLower = false,
    toUpper = false,
    removeSpecialChars = false,
    removeDiacritics = false,
    removeExtraSpaces = true
  } = options;

  let result = text;

  // Usuń nadmiarowe białe znaki
  if (trim) {
    result = result.trim();
  }

  // Usuń nadmiarowe spacje
  if (removeExtraSpaces) {
    result = result.replace(/\s+/g, ' ');
  }

  // Konwertuj wielkość liter
  if (toLower) {
    result = result.toLowerCase();
  } else if (toUpper) {
    result = result.toUpperCase();
  }

  // Usuń znaki specjalne
  if (removeSpecialChars) {
    result = result.replace(/[^\w\s]/g, '');
  }

  // Usuń znaki diakrytyczne
  if (removeDiacritics) {
    result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  return result;
}

/**
 * Sprawdza czy tekst jest pusty
 */
export function isEmpty(text: string | null | undefined): boolean {
  if (!text) return true;
  return text.trim().length === 0;
}

/**
 * Sprawdza czy tekst zawiera tylko cyfry
 */
export function isNumeric(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^\d+$/.test(text.trim());
}

/**
 * Sprawdza czy tekst zawiera tylko litery
 */
export function isAlpha(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^[a-zA-Z]+$/.test(text.trim());
}

/**
 * Sprawdza czy tekst zawiera tylko litery i cyfry
 */
export function isAlphanumeric(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^[a-zA-Z0-9]+$/.test(text.trim());
}

/**
 * Sprawdza czy tekst jest poprawnym adresem email
 */
export function isEmail(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim());
}

/**
 * Sprawdza czy tekst jest poprawnym numerem telefonu
 */
export function isPhone(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^\+?[\d\s-]+$/.test(text.trim());
}

/**
 * Sprawdza czy tekst jest poprawnym kodem pocztowym
 */
export function isPostalCode(text: string | null | undefined): boolean {
  if (!text) return false;
  return /^\d{2}-\d{3}$/.test(text.trim());
}

/**
 * Sprawdza czy tekst jest poprawnym numerem NIP
 */
export function isTaxId(text: string | null | undefined): boolean {
  if (!text) return false;
  const cleaned = text.replace(/[^0-9]/g, '');
  return cleaned.length === 10;
}

/**
 * Sprawdza czy tekst jest poprawnym numerem konta bankowego
 */
export function isBankAccount(text: string | null | undefined): boolean {
  if (!text) return false;
  const cleaned = text.replace(/[^0-9]/g, '');
  return cleaned.length === 26;
} 