export interface TextNormalizationOptions {
  toUpper?: boolean;
  removeSpecial?: boolean;
  normalizePolish?: boolean;
  debug?: boolean;
}

const POLISH_CHARS_MAP = {
  'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
  'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
};

/**
 * Usuwa znaki specjalne z tekstu
 */
export function removeSpecialCharacters(text: string): string {
  return text.replace(/[^a-zA-Z0-9\s\-.,]/g, '');
}

/**
 * Normalizuje spacje w tekście
 */
export function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Normalizuje wielkość liter w tekście
 */
export function normalizeCase(text: string, toUpper: boolean = false): string {
  return toUpper ? text.toUpperCase() : text;
}

/**
 * Normalizuje polskie znaki w tekście
 */
export function normalizePolishChars(text: string): string {
  return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => POLISH_CHARS_MAP[char as keyof typeof POLISH_CHARS_MAP] || char);
}

/**
 * Normalizuje tekst według podanych opcji
 */
export function normalizeText(text: string | null | undefined, options: TextNormalizationOptions = {}): string {
  const { toUpper = false, removeSpecial = false, normalizePolish = false, debug = false } = options;
  
  if (!text) return '';
  
  if (debug) console.log('[normalizeText] Start:', text);
  
  let normalized = text;
  
  // 1. Normalizuj polskie znaki
  if (normalizePolish) {
    normalized = normalizePolishChars(normalized);
    if (debug) console.log('[normalizeText] Po normalizacji polskich znaków:', normalized);
  }
  
  // 2. Usuń znaki specjalne
  if (removeSpecial) {
    normalized = removeSpecialCharacters(normalized);
    if (debug) console.log('[normalizeText] Po usunięciu znaków specjalnych:', normalized);
  }
  
  // 3. Normalizuj spacje
  normalized = normalizeSpaces(normalized);
  if (debug) console.log('[normalizeText] Po normalizacji spacji:', normalized);
  
  // 4. Normalizuj wielkość liter
  normalized = normalizeCase(normalized, toUpper);
  if (debug) console.log('[normalizeText] Po normalizacji wielkości liter:', normalized);
  
  return normalized;
}

/**
 * Czyści tekst (usuwa znaki specjalne, normalizuje spacje, zamienia na wielkie litery)
 */
export function cleanText(text: string | null | undefined): string {
  return normalizeText(text, {
    toUpper: true,
    removeSpecial: true,
    normalizePolish: true
  });
} 