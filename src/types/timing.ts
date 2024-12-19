export interface ProcessingTiming {
  uploadStartTime: number;
  uploadEndTime: number;
  ocrStartTime: number;
  ocrEndTime: number;
  analysisStartTime: number;
  analysisEndTime: number;
}

export interface TimingStats {
  uploadTime: number;
  ocrTime: number;
  analysisTime: number;
  totalTime: number;
  averageTimePerDocument: number;
  documentsProcessed: number;
  parallelProcessing: boolean;
} 