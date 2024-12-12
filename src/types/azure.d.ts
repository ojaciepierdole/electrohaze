declare module '@azure/ai-form-recognizer' {
  export class AzureKeyCredential {
    constructor(key: string);
  }

  export class DocumentAnalysisClient {
    constructor(endpoint: string, credential: AzureKeyCredential);
    beginAnalyzeDocument(modelId: string, buffer: ArrayBuffer): Promise<DocumentPoller>;
  }

  export interface DocumentPoller {
    pollUntilDone(): Promise<DocumentAnalysisResponse>;
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