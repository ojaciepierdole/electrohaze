import type { TextNormalizationOptions } from './types';

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
 * Usuwa znaki specjalne - bardziej agresywna wersja
 */
export function removeSpecialCharacters(text: string | null): string | null {
  if (!text) return null;
  
  // Najpierw usuń przecinki i kropki na końcu tekstu
  let cleaned = text.replace(/[,\.]+\s*$/g, '');
  
  // Następnie usuń przecinki i kropki między słowami
  cleaned = cleaned.replace(/[,\.]+(\s|$)/g, ' ');
  
  // Usuń wszystkie znaki interpunkcyjne i specjalne, zachowując myślniki w adresach
  cleaned = cleaned
    .replace(/[^\p{L}\p{N}\s\-]/gu, ' ') // usuń wszystko oprócz liter, cyfr, spacji i myślników
    .replace(/\s+/g, ' ') // normalizuj spacje
    .replace(/\s*\-\s*/g, '-') // normalizuj myślniki (usuń spacje wokół nich)
    .trim();
    
  console.log('[removeSpecialCharacters] Przed:', text, 'Po:', cleaned);
  return cleaned;
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
export function normalizeText(text: string | null, options: TextNormalizationOptions = {}): string | null {
  if (!text) return null;

  const {
    toUpper = true,
    removeSpecialChars = true,
    removeDiacritics = false,
    trim = true,
    trimWhitespace = true,
    debug = false
  } = options;

  if (debug) console.log('[normalizeText] Początek:', text);
  let normalized = text;
  
  // Kolejność jest ważna:
  // 1. Najpierw usuwamy znaki specjalne (zamienia je na spacje)
  if (removeSpecialChars) {
    normalized = removeSpecialCharacters(normalized) || '';
    if (debug) console.log('[normalizeText] Po usunięciu znaków specjalnych:', normalized);
  }
  
  // 2. Normalizujemy spacje (po usunięciu znaków specjalnych)
  if (trimWhitespace) {
    normalized = normalizeSpaces(normalized) || '';
    if (debug) console.log('[normalizeText] Po normalizacji spacji:', normalized);
  }
  
  // 3. Opcjonalnie normalizujemy polskie znaki
  if (removeDiacritics) {
    normalized = normalizePolishChars(normalized) || '';
    if (debug) console.log('[normalizeText] Po normalizacji polskich znaków:', normalized);
  }
  
  // 4. Na końcu zmieniamy wielkość liter
  if (toUpper) {
    normalized = normalizeCase(normalized, toUpper) || '';
    if (debug) console.log('[normalizeText] Po zmianie wielkości liter:', normalized);
  }

  return normalized || null;
}

/**
 * Czyści tekst ze znaków specjalnych, normalizuje spacje i konwertuje na wielkie litery
 */
export function cleanText(value: string | null, options: TextNormalizationOptions = {}): string {
  if (!value) return '';
  
  console.log('[cleanText] Przed:', value);
  const cleaned = normalizeText(value, {
    toUpper: options.toUpper ?? true,
    removeSpecialChars: true,
    removeDiacritics: options.removeDiacritics ?? false,
    trim: options.trim ?? true,
    trimWhitespace: options.trimWhitespace ?? true,
    debug: options.debug ?? false
  }) || '';
  console.log('[cleanText] Po:', cleaned);
  
  return cleaned;
} 