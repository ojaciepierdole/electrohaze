/**
 * Funkcje pomocnicze do normalizacji tekstu
 */

import type { TextNormalizationOptions } from '../../text-processing/core/types';

/**
 * Normalizuje tekst według podanych opcji
 * @param value Tekst do normalizacji
 * @param options Opcje normalizacji
 * @returns Znormalizowany tekst lub null jeśli wejście jest nullem/undefined
 */
export function normalizeText(
  value: string | null | undefined,
  options: TextNormalizationOptions = {}
): string | null {
  if (!value) return null;
  
  const {
    toUpper = false,
    toLower = false,
    removeSpecialChars = false,
    removeDiacritics = false,
    trim = true
  } = options;

  let normalized = value;
  
  // Usuń zbędne białe znaki
  if (trim) {
    normalized = normalized.trim().replace(/\s+/g, ' ');
  }
  
  if (removeDiacritics) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  
  if (removeSpecialChars) {
    normalized = normalized.replace(/[^a-zA-Z0-9\s]/g, '');
  }
  
  if (toUpper) {
    normalized = normalized.toUpperCase();
  } else if (toLower) {
    normalized = normalized.toLowerCase();
  }
  
  return normalized;
}

/**
 * Usuwa znaki specjalne z tekstu
 */
export function removeSpecialCharacters(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value.replace(/[^a-zA-Z0-9\s]/g, '');
}

/**
 * Usuwa nadmiarowe białe znaki
 */
export function removeExtraWhitespace(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value.trim().replace(/\s+/g, ' ');
}

/**
 * Konwertuje tekst na wielkie litery
 */
export function toUpperCase(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value.toUpperCase();
}

/**
 * Konwertuje tekst na małe litery
 */
export function toLowerCase(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value.toLowerCase();
}

/**
 * Formatuje tekst do postaci tytułu (pierwsza litera każdego słowa wielka)
 */
export function toTitleCase(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Usuwa polskie znaki diakrytyczne
 */
export function removeDiacritics(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Usuwa wszystkie znaki niebędące literami
 */
export function lettersOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value.replace(/[^a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '');
}

/**
 * Usuwa wszystkie znaki niebędące cyframi
 */
export function numbersOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  
  return value.replace(/[^0-9]/g, '');
} 