import type { 
  DocumentField,
  AnalyzeResult,
  DocumentAnalysisClient,
  AzureKeyCredential,
  AnalyzedDocument,
  AnalyzeDocumentPoller
} from '@azure/ai-form-recognizer';
import { AbortSignalLike } from '@azure/abort-controller';

// Re-eksport typów z Azure Form Recognizer
export type {
  DocumentField,
  AnalyzeResult,
  DocumentAnalysisClient,
  AzureKeyCredential,
  AnalyzedDocument,
  AnalyzeDocumentPoller,
  AbortSignalLike
};

// Aliasy typów dla lepszej czytelności
export type DocumentAnalysisResponse = AnalyzeResult<AnalyzedDocument>;
export type DocumentPoller = AnalyzeDocumentPoller;

// Własne typy bazujące na typach z Azure
export type DocumentFields = Record<string, DocumentField>; 