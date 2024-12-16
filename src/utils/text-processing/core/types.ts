import { DocumentField } from '@azure/ai-form-recognizer';

/**
 * Opcje przetwarzania tekstu
 */
export interface TextProcessingOptions {
  trim?: boolean;
  toLower?: boolean;
  toUpper?: boolean;
  removeSpecialChars?: boolean;
  removeDiacritics?: boolean;
  removeExtraSpaces?: boolean;
}

/**
 * Rozszerzone pole dokumentu
 */
export interface ExtendedDocumentField extends DocumentField {
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
 * Pole z pewnością
 */
export interface FieldWithConfidence {
  content: string;
  confidence: number;
} 