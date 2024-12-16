import type { 
  DocumentField as AzureDocumentField,
  DocumentObjectField
} from '@azure/ai-form-recognizer';

export interface DocumentField {
  content: string | null | undefined;
  confidence: number;
  kind?: string;
  properties?: Record<string, DocumentField>;
  isEnriched?: boolean;
  metadata?: Record<string, unknown>;
}

// Typ reprezentujący strukturę dokumentu z sekcjami i polami
export type DocumentData = {
  [section: string]: {
    [field: string]: DocumentField;
  };
};

export interface TransformationContext {
  value: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  field: string;
  section?: string;
  allFields?: Record<string, DocumentField>;
  document?: Record<string, DocumentField>;
}

export interface TransformationResult {
  value: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  additionalFields?: Record<string, { value: string; confidence: number }>;
}

export interface TransformationRule {
  name: string;
  description: string;
  priority: number;
  condition?: (value: string, context: TransformationContext) => boolean;
  transform: (value: string, context: TransformationContext) => TransformationResult;
}

export interface ProcessSectionContext {
  pe?: Record<string, DocumentField>;
  customer?: Record<string, DocumentField>;
  correspondence?: Record<string, DocumentField>;
  supplier?: Record<string, DocumentField>;
  billing?: Record<string, DocumentField>;
  metadata?: Record<string, unknown>;
  _context?: {
    pe?: Record<string, DocumentField>;
    customer?: Record<string, DocumentField>;
    correspondence?: Record<string, DocumentField>;
    supplier?: Record<string, DocumentField>;
    billing?: Record<string, DocumentField>;
  };
}

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

export interface FieldWithConfidence {
  content: string | null | undefined;
  confidence: number;
  isEnriched?: boolean;
  metadata?: Record<string, unknown>;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  fields?: Record<string, DocumentField>;
  errors?: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface ProcessSectionInput {
  section: string;
  fields: Record<string, DocumentField>;
  allFields?: Record<string, DocumentField>;
  metadata?: Record<string, unknown>;
} 