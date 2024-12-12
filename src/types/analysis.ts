export interface ModelResult {
  modelId: string;
  fields: Record<string, ProcessedField>;
  confidence: number;
  pageCount: number;
}

export interface AnalysisResult {
  fileName: string;
  modelResults: ModelResult[];
}

export interface ProcessedField {
  content: string | null;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface GroupedResult {
  fileName: string;
  modelResults: ModelResult[];
} 