import type { ProcessingResult } from './processing';
import type { ISODateString } from './common';

export interface BatchProcessingOptions {
  maxConcurrent?: number;
  timeoutMs?: number;
  retryCount?: number;
}

export interface BatchProcessingProgress {
  total: number;
  processed: number;
  failed: number;
  inProgress: number;
}

export interface BatchProcessingResult {
  results: ProcessingResult[];
  errors: Error[];
  progress: BatchProcessingProgress;
  totalTimeMs: number;
}

export type BatchProcessingStatus = 
  | 'idle'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProcessingStore {
  status: BatchProcessingStatus;
  progress: BatchProcessingProgress;
  results: ProcessingResult[];
  errors: Error[];
  startTime?: number;
  endTime?: number;
  currentFileIndex?: number;
  currentFileName?: string;
  currentModelIndex?: number;
  currentModelId?: string;
  fileProgress?: number;
  totalProgress?: number;
  error?: string;
  reset: () => void;
}

export interface DocumentAnalysisResult {
  documentId: string;
  status: 'succeeded' | 'failed';
  createdOn: string;
  lastUpdatedOn: string;
  analyzeResult?: {
    version: string;
    modelId: string;
    content: string;
    pages: Array<{
      pageNumber: number;
      width: number;
      height: number;
      unit: string;
    }>;
    fields: Record<string, unknown>;
  };
}