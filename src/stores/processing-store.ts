import { create } from 'zustand';
import type { BatchProcessingStatus } from '@/types/processing';

interface ProcessingStore extends BatchProcessingStatus {
  setProcessingStatus: (status: Partial<BatchProcessingStatus>) => void;
  reset: () => void;
}

const initialState: BatchProcessingStatus = {
  isProcessing: false,
  currentFileIndex: 0,
  currentFileName: null,
  currentModelIndex: 0,
  currentModelId: null,
  fileProgress: 0,
  totalProgress: 0,
  totalFiles: 0,
  results: [],
  error: null,
};

export const useProcessingStore = create<ProcessingStore>((set) => ({
  ...initialState,
  setProcessingStatus: (status) => set((state) => ({ ...state, ...status })),
  reset: () => set(initialState),
})); 