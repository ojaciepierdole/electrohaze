import { removeSpecialCharacters } from '@/utils/text-processing/core/normalization';

/**
 * Podstawowe funkcje normalizacji tekstu
 */

/**
 * Normalizuje spacje w tekście
 */
export function normalizeSpaces(text: string | null): string | null {
  if (!text) return null;
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizuje wielkość liter
 */
export function normalizeCase(text: string | null, toUpper: boolean = true): string | null {
  if (!text) return null;
  return toUpper ? text.toUpperCase() : text.toLowerCase();
}

/**
 * Normalizuje polskie znaki
 */
export function normalizePolishChars(text: string | null): string | null {
  if (!text) return null;
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Pełna normalizacja tekstu
 */
export function normalizeText(text: string | null, options: {
  toUpper?: boolean;
  removeSpecial?: boolean;
  normalizePolish?: boolean;
} = {}): string | null {
  if (!text) return null;

  const {
    toUpper = true,
    removeSpecial = true,
    normalizePolish = false
  } = options;

  let normalized = normalizeSpaces(text);
  
  if (removeSpecial) {
    normalized = removeSpecialCharacters(normalized);
  }
  
  if (normalizePolish) {
    normalized = normalizePolishChars(normalized);
  }
  
  if (toUpper !== null) {
    normalized = normalizeCase(normalized, toUpper);
  }

  return normalized;
} 