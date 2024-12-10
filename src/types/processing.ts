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
  currentFileName: string;
  currentModelIndex: number;
  currentModelId: string;
  fileProgress: number;
  totalProgress: number;
  results: ProcessingResult[];
}

export interface ProcessingResult {
  fileName: string;
  modelId: string;
  processingTime: number;
  supplierName: string;
  fields: Record<string, ProcessedField>;
  positiveBaseline: boolean;
  topScore: boolean;
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