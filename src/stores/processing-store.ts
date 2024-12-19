import { create } from 'zustand';
import type { ProcessingResult } from '@/types/processing';

interface ProcessingStore {
  isProcessing: boolean;
  currentFileName: string | null;
  currentModelId: string | null;
  currentFileIndex: number | null;
  totalFiles: number;
  fileProgress: number;
  totalProgress: number;
  results: ProcessingResult[];
  error: string | null;
  timing: {
    uploadTime: number;
    ocrTime: number;
    analysisTime: number;
  };
  setProcessingStatus: (status: Partial<ProcessingStore>) => void;
  reset: () => void;
}

type ProcessingState = Omit<ProcessingStore, 'setProcessingStatus' | 'reset'>;

const initialState: ProcessingState = {
  isProcessing: false,
  currentFileName: null,
  currentModelId: null,
  currentFileIndex: null,
  totalFiles: 0,
  fileProgress: 0,
  totalProgress: 0,
  results: [],
  error: null,
  timing: {
    uploadTime: 0,
    ocrTime: 0,
    analysisTime: 0
  }
};

export const useProcessingStore = create<ProcessingStore>((set) => ({
  ...initialState,
  setProcessingStatus: (status: Partial<ProcessingStore>) => set((state) => ({ ...state, ...status })),
  reset: () => set(initialState),
})); 