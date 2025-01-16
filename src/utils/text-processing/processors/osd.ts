import { normalizeText } from '../core/text-normalization';
import type { FieldWithConfidence } from '@/types/processing';

// Słownik poprawnych nazw OSD
export const OSD_NAMES: Record<string, string> = {
  // Podstawowe nazwy
  'RWE': 'RWE Stoen Operator Sp. z o.o.',
  'STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'RWE STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'PGE': 'PGE Dystrybucja SA',
  'ENEA': 'Enea Operator Sp. z o.o.',
  'TAURON': 'Tauron Dystrybucja SA',
  'ENERGA': 'Energa-Operator SA',
  
  // Warianty z błędami
  'RWE STOEN OPERATOR': 'RWE Stoen Operator Sp. z o.o.',
  'RWE SP Z O O': 'RWE Stoen Operator Sp. z o.o.',
  'RWE STOEN OPERATOR SP Z O O': 'RWE Stoen Operator Sp. z o.o.',
  'PGE DYSTRYBUCJA': 'PGE Dystrybucja SA',
  'PGE DYSTRYBUCJA S A': 'PGE Dystrybucja SA',
  'PGE DYSTRYBUCJA SA': 'PGE Dystrybucja SA',
  'PGE SA': 'PGE Dystrybucja SA',
  'PGEDYSTRYBUCJA': 'PGE Dystrybucja SA',
  'PGEDYSTRYBUCJASA': 'PGE Dystrybucja SA',
  'ENEA OPERATOR': 'Enea Operator Sp. z o.o.',
  'ENEA SP Z O O': 'Enea Operator Sp. z o.o.',
  'ENEA OPERATOR SP Z O O': 'Enea Operator Sp. z o.o.',
  'TAURON DYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TAURON DYSTRYBUCJA S A': 'Tauron Dystrybucja SA',
  'TAURON DYSTRYBUCJA SA': 'Tauron Dystrybucja SA',
  'ENERGA OPERATOR': 'Energa-Operator SA',
  'ENERGA OPERATOR S A': 'Energa-Operator SA',
  'ENERGA OPERATOR SA': 'Energa-Operator SA',
  
  // Warianty z prefixami
  'TARYFA ENERGA OPERATOR': 'Energa-Operator SA',
  'TARYFA PGE DYSTRYBUCJA': 'PGE Dystrybucja SA',
  'TARYFA TAURON DYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TARYFA ENEA OPERATOR': 'Enea Operator Sp. z o.o.',
  'TARYFA RWE STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'TARYFY ENERGA OPERATOR': 'Energa-Operator SA',
  'TARYFY PGE DYSTRYBUCJA': 'PGE Dystrybucja SA',
  'TARYFY TAURON DYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TARYFY ENEA OPERATOR': 'Enea Operator Sp. z o.o.',
  'TARYFY RWE STOEN': 'RWE Stoen Operator Sp. z o.o.',
  
  // Warianty bez spacji
  'ENERGAOPERATOR': 'Energa-Operator SA',
  'ENERGAOPERATORSA': 'Energa-Operator SA',
  'TAURONDYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TAURONDYSTRYBUCJASA': 'Tauron Dystrybucja SA',
  'ENEAOPERATOR': 'Enea Operator Sp. z o.o.',
  'ENEAOPERATORSPZOO': 'Enea Operator Sp. z o.o.',
  'RWESTOENOPERATOR': 'RWE Stoen Operator Sp. z o.o.',
  'RWESTOENOPERATORSPZOO': 'RWE Stoen Operator Sp. z o.o.'
};

// Prefixy do usunięcia (posortowane od najdłuższego do najkrótszego)
const PREFIXES_TO_REMOVE = [
  'WEDŁUG TARYFY',
  'WG TARYFY',
  'Z TARYFY',
  'Z TARYFĄ',
  'TARYFY',
  'TARYFĄ',
  'TARYFA'
].sort((a, b) => b.length - a.length);

/**
 * Normalizuje nazwę OSD
 */
export function normalizeOSDName(value: string | null, options: { debug?: boolean } = {}): string {
  const { debug } = options;
  if (!value) return '';
  
  if (debug) console.log('[normalizeOSDName] Start:', value);
  
  // 1. Normalizuj tekst
  const normalized = normalizeText(value, {
    toUpper: true,
    removeSpecial: true,
    normalizePolish: true,
    debug
  }) || '';
  
  if (debug) console.log('[normalizeOSDName] Po normalizacji:', normalized);
  
  // 2. Sprawdź dokładne dopasowanie w słowniku
  const exactMatch = OSD_NAMES[normalized];
  if (exactMatch) {
    if (debug) console.log('[normalizeOSDName] Znaleziono dokładne dopasowanie:', exactMatch);
    return exactMatch;
  }
  
  // 3. Szukaj najdłuższego dopasowania w tekście
  let bestMatch = '';
  let bestMatchLength = 0;
  
  for (const [key, name] of Object.entries(OSD_NAMES)) {
    if (normalized.includes(key) && key.length > bestMatchLength) {
      bestMatch = name;
      bestMatchLength = key.length;
      if (debug) console.log('[normalizeOSDName] Znaleziono częściowe dopasowanie:', { key, name });
    }
  }
  
  if (bestMatch) {
    if (debug) console.log('[normalizeOSDName] Wybrano najlepsze dopasowanie:', bestMatch);
    return bestMatch;
  }
  
  if (debug) console.log('[normalizeOSDName] Nie znaleziono dopasowania');
  return '';
}

/**
 * Przetwarza pole z nazwą OSD
 */
export function processOSDField(field: FieldWithConfidence | undefined, options: { debug?: boolean } = {}): FieldWithConfidence | undefined {
  const { debug = true } = options;
  if (!field?.content) return field;
  
  if (debug) console.log('[processOSDField] Start:', field);
  
  const normalizedName = normalizeOSDName(field.content, { debug: true });
  
  // Jeśli nie znaleziono nazwy OSD, zwróć pole z obniżoną pewnością
  if (!normalizedName) {
    if (debug) console.log('[processOSDField] Nie znaleziono nazwy OSD:', field.content);
    return {
      ...field,
      confidence: field.confidence * 0.5,
      metadata: {
        ...field.metadata,
        fieldType: 'OSD_name',
        transformationType: 'invalid',
        originalValue: field.content
      }
    };
  }
  
  // Jeśli znaleziono nazwę OSD, zwiększ pewność
  if (debug) console.log('[processOSDField] Znormalizowano nazwę OSD:', normalizedName);
  return {
    ...field,
    content: normalizedName,
    confidence: Math.min(field.confidence * 1.2, 1),
    metadata: {
      ...field.metadata,
      fieldType: 'OSD_name',
      transformationType: 'normalized',
      originalValue: field.content
    }
  };
} 