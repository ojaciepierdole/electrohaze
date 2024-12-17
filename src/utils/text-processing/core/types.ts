import type { DocumentField } from '@/types/processing';

/**
 * Opcje normalizacji tekstu
 */
export interface TextNormalizationOptions {
  /**
   * Czy usunąć białe znaki z początku i końca tekstu
   * @default true
   */
  trim?: boolean;

  /**
   * Czy usunąć nadmiarowe spacje
   * @default true
   */
  trimWhitespace?: boolean;

  /**
   * Czy zamienić tekst na małe litery
   * @default false
   */
  toLower?: boolean;

  /**
   * Czy zamienić tekst na wielkie litery
   * @default false
   */
  toUpper?: boolean;

  /**
   * Wymuszenie wielkości liter
   * @default 'none'
   */
  enforceCase?: 'upper' | 'lower' | 'none';

  /**
   * Czy usunąć znaki specjalne
   * @default false
   */
  removeSpecialChars?: boolean;

  /**
   * Czy usunąć znaki diakrytyczne
   * @default false
   */
  removeDiacritics?: boolean;

  /**
   * Czy normalizować polskie znaki
   * @default false
   */
  normalizePolish?: boolean;

  /**
   * Czy usunąć nadmiarowe spacje
   * @default true
   */
  removeExtraSpaces?: boolean;

  /**
   * Czy usunąć znaki specjalne (bardziej agresywna wersja)
   * @default false
   */
  removeSpecial?: boolean;

  /**
   * Czy włączyć debugowanie
   * @default false
   */
  debug?: boolean;
}

/**
 * Rozszerzone pole dokumentu
 */
export type ExtendedDocumentField = DocumentField & {
  content: string;
  confidence: number;
  kind: string;
  properties?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Kontekst transformacji
 */
export interface TransformationContext {
  field?: DocumentField;
  document?: {
    fields: Record<string, DocumentField>;
  };
  options?: Record<string, unknown>;
}

/**
 * Wynik przetwarzania
 */
export interface ProcessingResult {
  success: boolean;
  value?: string;
  confidence?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Reguła transformacji
 */
export interface TransformationRule {
  name: string;
  description: string;
  priority: number;
  transform: (context: TransformationContext) => ProcessingResult;
}

/**
 * Wynik transformacji
 */
export interface TransformationResult {
  value: string;
  confidence: number;
  metadata: {
    transformationType: string;
    fieldType: string;
    source: string;
    status: string;
    [key: string]: unknown;
  };
}

/**
 * Typ pola z wartością i pewnością
 */
export interface FieldWithConfidence {
  /**
   * Wartość pola
   */
  content: string;

  /**
   * Pewność rozpoznania (0-1)
   */
  confidence: number;

  /**
   * Metadane pola
   */
  metadata?: {
    /**
     * Typ pola
     */
    fieldType?: string;

    /**
     * Typ transformacji
     */
    transformationType?: string;

    /**
     * Źródło danych
     */
    source?: string;

    /**
     * Oryginalna wartość
     */
    originalValue?: string;

    /**
     * Dodatkowe metadane
     */
    [key: string]: unknown;
  };
} 