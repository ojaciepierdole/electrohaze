import type { FieldWithConfidence } from './common';

// Podstawowy typ dla pola dokumentu
export interface DocumentField extends FieldWithConfidence {
  kind?: string;
  properties?: Record<string, DocumentField>;
  content: string;
  confidence: number;
  metadata: {
    fieldType?: string;
    transformationType?: string;
    originalValue?: string;
    [key: string]: unknown;
  };
}

// Struktura dokumentu
export type DocumentData = {
  [section: string]: {
    [field: string]: DocumentField;
  };
};

// Kontekst transformacji
export interface TransformationContext {
  value: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  field: string;
  section?: string;
  allFields?: Record<string, DocumentField>;
  document?: Record<string, DocumentField>;
}

// Wynik transformacji
export interface TransformationResult {
  value: string;
  confidence: number;
  metadata: {
    fieldType: string;
    transformationType: string;
    originalValue?: string;
    [key: string]: unknown;
  };
  additionalFields?: Record<string, { value: string; confidence: number }>;
}

// Reguła transformacji
export interface TransformationRule {
  name: string;
  description: string;
  priority: number;
  condition?: (value: string, context: TransformationContext) => boolean;
  transform: (value: string, context: TransformationContext) => TransformationResult;
}

// Kontekst przetwarzania sekcji
export interface ProcessSectionContext {
  ppe?: Record<string, DocumentField>;
  customer?: Record<string, DocumentField>;
  correspondence?: Record<string, DocumentField>;
  supplier?: Record<string, DocumentField>;
  billing?: Record<string, DocumentField>;
  metadata?: Record<string, unknown>;
}

// Wynik analizy dokumentu
export interface DocumentAnalysisResult {
  modelId: string;
  content: string;
  pages: Array<{
    pageNumber: number;
    width: number;
    height: number;
    unit: string;
  }>;
  fields: Record<string, DocumentField>;
  documents?: Array<{
    docType: string;
    boundingRegions?: Array<{
      pageNumber: number;
      polygon: number[];
    }>;
    fields: Record<string, DocumentField>;
    confidence?: number;
  }>;
}

// Wynik przetwarzania dokumentu
export interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  fields?: Record<string, DocumentField>;
  errors?: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

// Input dla przetwarzania sekcji
export interface ProcessSectionInput {
  section: string;
  fields: Record<string, DocumentField>;
  allFields?: Record<string, DocumentField>;
  metadata?: Record<string, unknown>;
} 