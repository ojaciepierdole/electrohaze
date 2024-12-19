import { create } from 'zustand';
import type { BatchProcessingStatus, ProcessingResult } from '@/types/processing';

interface ProcessingStore extends Omit<BatchProcessingStatus, 'results'> {
  results: ProcessingResult[];
  setProcessingStatus: (status: Partial<BatchProcessingStatus>) => void;
  reset: () => void;
}

const initialState: Omit<ProcessingStore, 'setProcessingStatus' | 'reset'> = {
  isProcessing: false,
  currentFileName: null,
  currentModelId: null,
  fileProgress: 0,
  totalProgress: 0,
  results: [] as ProcessingResult[],
  error: null
};

export const useProcessingStore = create<ProcessingStore>((set) => ({
  ...initialState,
  setProcessingStatus: (status) => set((state) => ({ ...state, ...status })),
  reset: () => set(initialState),
})); 