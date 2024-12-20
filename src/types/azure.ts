import type { 
  DocumentField,
  AnalyzeResult,
  DocumentAnalysisClient,
  AzureKeyCredential,
  AnalyzedDocument
} from '@azure/ai-form-recognizer';
import { AbortSignalLike } from '@azure/abort-controller';
import type { OperationState } from '@azure/core-lro';

// Re-eksport typów z Azure Form Recognizer
export type {
  DocumentField,
  AnalyzeResult,
  DocumentAnalysisClient,
  AzureKeyCredential,
  AnalyzedDocument,
  AbortSignalLike
};

// Aliasy typów dla lepszej czytelności
export type DocumentAnalysisResponse = AnalyzeResult<AnalyzedDocument>;
export type DocumentPoller = {
  getOperationState(): Promise<OperationState<AnalyzeResult<AnalyzedDocument>>>;
  poll(options?: { abortSignal?: AbortSignalLike; intervalInMs?: number }): Promise<OperationState<AnalyzeResult<AnalyzedDocument>>>;
  pollUntilDone(options?: { abortSignal?: AbortSignalLike; intervalInMs?: number }): Promise<AnalyzeResult<AnalyzedDocument>>;
};

// Własne typy bazujące na typach z Azure
export type DocumentFields = Record<string, DocumentField>;

export interface AzureDocumentField {
  type: string;
  content: string;
  confidence: number;
  boundingRegions?: {
    pageNumber: number;
    boundingBox: number[];
  }[];
}

export interface AzureAnalyzeResult {
  fields: Record<string, AzureDocumentField>;
  confidence: number;
}

export interface AzurePoller {
  isDone(): boolean;
  pollUntilDone(): Promise<void>;
  getResult(): Promise<AzureAnalyzeResult>;
}