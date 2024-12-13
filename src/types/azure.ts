import type { 
  DocumentField,
  AnalyzeResult,
  DocumentAnalysisClient,
  DocumentAnalysisOperation,
  AzureKeyCredential 
} from '@azure/ai-form-recognizer';

// Re-eksport typów z Azure Form Recognizer
export type {
  DocumentField,
  AnalyzeResult,
  DocumentAnalysisClient,
  DocumentAnalysisOperation,
  AzureKeyCredential
};

// Aliasy typów dla lepszej czytelności
export type DocumentAnalysisResponse = AnalyzeResult;
export type DocumentPoller = DocumentAnalysisOperation;

// Własne typy bazujące na typach z Azure
export type DocumentFields = Record<string, DocumentField>; 