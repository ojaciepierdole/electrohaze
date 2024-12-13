declare module '@azure/ai-form-recognizer' {
  import { AbortSignalLike } from '@azure/core-rest-pipeline';

  export class AzureKeyCredential {
    constructor(key: string);
  }

  export class DocumentAnalysisClient {
    constructor(endpoint: string, credential: AzureKeyCredential);
    beginAnalyzeDocument(modelId: string, buffer: ArrayBuffer): Promise<DocumentPoller>;
  }

  export interface PollOperationState<T> {
    isStarted: boolean;
    isCompleted: boolean;
    isCancelled: boolean;
    error?: Error;
    result?: T;
  }

  export interface DocumentPoller {
    getOperationState(): Promise<PollOperationState<DocumentAnalysisResponse>>;
    poll(options?: { abortSignal?: AbortSignalLike }): Promise<PollOperationState<DocumentAnalysisResponse>>;
    pollUntilDone(options?: { updateIntervalInMs?: number; abortSignal?: AbortSignalLike }): Promise<DocumentAnalysisResponse>;
  }

  export interface DocumentAnalysisResponse {
    documents: Array<{
      docType: string;
      fields: Record<string, DocumentField>;
      confidence: number;
      spans?: Array<{
        offset: number;
        length: number;
      }>;
    }>;
    pages: Array<{
      pageNumber: number;
      width: number;
      height: number;
      unit: string;
      spans?: Array<{
        offset: number;
        length: number;
      }>;
    }>;
  }

  export interface DocumentField {
    value: string | null;
    content?: string;
    confidence: number;
    type: string;
    boundingRegions?: Array<{
      pageNumber: number;
      boundingBox?: [number, number, number, number];
    }>;
    spans?: Array<{
      offset: number;
      length: number;
    }>;
  }
} 