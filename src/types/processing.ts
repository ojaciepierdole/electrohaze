import { FIELD_GROUPS } from '@/config/fields';

export type FieldGroupKey = keyof typeof FIELD_GROUPS;

export interface ProcessedField {
  content: string | null;
  confidence: number;
  type: string;
  page: number;
}

export interface BatchProcessingStatus {
  isProcessing: boolean;
  currentFileIndex: number;
  currentFileName: string | null;
  currentModelIndex: number;
  currentModelId: string | null;
  fileProgress: number;
  totalProgress: number;
  results: ProcessingResult[];
  error: string | null;
}

export interface ProcessingResult {
  fileName: string;
  results: Array<{
    modelId: string;
    fields: Record<string, ProcessedField>;
    confidence: number;
    pageCount: number;
  }>;
  processingTime: number;
}

export interface AnalysisField {
  name: string;
  type: string;
  isRequired: boolean;
  description?: string;
  group: FieldGroupKey;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  fields: AnalysisField[];
} 