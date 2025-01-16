import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import { useProcessingStore } from '@/stores/processing-store';
import type { ProcessingResult, BatchProcessingStatus } from '@/types/processing';

interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
  progress: number;
  lastSavedDocument: null;
  isPaused: boolean;
  currentOperation: string | null;
  processedFiles: number;
  totalFiles: number;
}

interface ProgressUpdate {
  status: 'running' | 'completed' | 'failed';
  progress: number;
  currentOperation?: string;
  error?: string;
  stage?: 'preparing' | 'reading' | 'analyzing' | 'extracting' | 'finalizing';
  details?: {
    page?: number;
    totalPages?: number;
    currentField?: string;
    confidence?: number;
  };
  processedFiles?: number;
  totalFiles?: number;
}

const STAGE_WEIGHTS = {
  preparing: 0.1,
  reading: 0.2,
  analyzing: 0.4,
  extracting: 0.2,
  finalizing: 0.1
};

export function useDocumentProcessing() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: 0,
    lastSavedDocument: null,
    isPaused: false,
    currentOperation: null,
    processedFiles: 0,
    totalFiles: 0
  });
  
  const progressRef = useRef<{
    stage: keyof typeof STAGE_WEIGHTS;
    stageProgress: number;
    lastUpdate: number;
    processedFiles: number;
    totalFiles: number;
    results: ProcessingResult[];
  }>({
    stage: 'preparing',
    stageProgress: 0,
    lastUpdate: Date.now(),
    processedFiles: 0,
    totalFiles: 0,
    results: []
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const { addToast } = useToast();
  const setProcessingStatus = useProcessingStore(state => state.setProcessingStatus);

  const calculateTotalProgress = useCallback((
    stage: keyof typeof STAGE_WEIGHTS, 
    stageProgress: number, 
    processedFiles: number, 
    totalFiles: number
  ): number => {
    if (totalFiles === 1) {
      let totalProgress = 0;
      let passedStages = 0;
      
      for (const [currentStage, weight] of Object.entries(STAGE_WEIGHTS)) {
        if (currentStage === stage) {
          totalProgress += weight * (stageProgress / 100);
          break;
        }
        totalProgress += weight;
        passedStages++;
      }
      
      if (passedStages === 0 && stageProgress < 20) {
        return Math.min(Math.round(totalProgress * 100), 20);
      }
      
      return Math.min(Math.round(totalProgress * 100), 100);
    } else {
      const fileProgress = stageProgress / 100;
      const totalProgress = ((processedFiles + fileProgress) / totalFiles) * 100;
      return Math.min(Math.round(totalProgress), 100);
    }
  }, []);

  const cleanupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Zamykanie połączenia SSE');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupEventSource();
    };
  }, [cleanupEventSource]);

  const updateProgress = useCallback((update: ProgressUpdate) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - progressRef.current.lastUpdate;
    
    if (timeSinceLastUpdate < 100 && Math.abs(update.progress - progressRef.current.stageProgress) < 5) {
      return;
    }

    progressRef.current.lastUpdate = now;
    
    if (update.stage && update.stage !== progressRef.current.stage) {
      progressRef.current.stage = update.stage;
      progressRef.current.stageProgress = 0;
    }

    if (update.processedFiles !== undefined) {
      progressRef.current.processedFiles = update.processedFiles;
    }
    if (update.totalFiles !== undefined) {
      progressRef.current.totalFiles = update.totalFiles;
    }

    progressRef.current.stageProgress = update.progress;
    const totalProgress = calculateTotalProgress(
      progressRef.current.stage, 
      update.progress,
      progressRef.current.processedFiles,
      progressRef.current.totalFiles
    );

    setState(prev => ({
      ...prev,
      progress: totalProgress,
      currentOperation: update.currentOperation || getOperationDescription(progressRef.current.stage, update.details),
      error: update.error || null,
      isProcessing: update.status === 'running',
      processedFiles: progressRef.current.processedFiles,
      totalFiles: progressRef.current.totalFiles
    }));

    setProcessingStatus({
      isProcessing: update.status === 'running',
      fileProgress: update.progress,
      totalProgress,
      currentFileName: update.currentOperation,
      error: update.error,
      totalFiles: progressRef.current.totalFiles,
      currentFileIndex: progressRef.current.processedFiles,
      results: progressRef.current.results
    });
  }, [calculateTotalProgress, setProcessingStatus]);

  const setupProgressTracking = useCallback((isSingleDocument: boolean, totalFiles: number) => {
    cleanupEventSource();

    const url = `/api/analyze/progress?sessionId=${sessionIdRef.current}`;
    const maxRetries = 3;
    let retryCount = 0;
    
    progressRef.current = {
      stage: 'preparing',
      stageProgress: 0,
      lastUpdate: Date.now(),
      processedFiles: 0,
      totalFiles,
      results: []
    };

    setState(prev => ({
      ...prev,
      isProcessing: true,
      progress: 0,
      error: null,
      processedFiles: 0,
      totalFiles,
      currentOperation: 'Inicjalizacja przetwarzania...'
    }));
    
    setProcessingStatus({
      isProcessing: true,
      fileProgress: 0,
      totalProgress: 0,
      currentFileName: null,
      error: null,
      totalFiles,
      currentFileIndex: 0,
      results: []
    });
    
    const createEventSource = () => {
      if (eventSourceRef.current) {
        cleanupEventSource();
      }

      console.log('Tworzenie nowego połączenia SSE');
      eventSourceRef.current = new EventSource(url);
      
      eventSourceRef.current.onopen = () => {
        console.log('Nawiązano połączenie SSE');
        retryCount = 0;
      };
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const update = JSON.parse(event.data) as ProgressUpdate & { result?: ProcessingResult };
          console.log('Otrzymano aktualizację:', update);
          
          if (update.result) {
            progressRef.current.results.push(update.result);
            progressRef.current.processedFiles++;
          }

          const stage = update.stage || progressRef.current.stage;
          const stageProgress = update.progress || 0;
          const totalProgress = calculateTotalProgress(
            stage,
            stageProgress,
            progressRef.current.processedFiles,
            progressRef.current.totalFiles
          );
          
          setState(prev => ({
            ...prev,
            isProcessing: true,
            progress: totalProgress,
            currentOperation: update.currentOperation || getOperationDescription(stage, update.details),
            processedFiles: progressRef.current.processedFiles,
            totalFiles: progressRef.current.totalFiles
          }));
          
          setProcessingStatus({
            isProcessing: true,
            fileProgress: stageProgress,
            totalProgress,
            currentFileName: update.currentOperation,
            error: null,
            totalFiles: progressRef.current.totalFiles,
            currentFileIndex: progressRef.current.processedFiles,
            results: progressRef.current.results
          });
        } catch (error) {
          console.error('Błąd parsowania danych SSE:', error);
        }
      };

      eventSourceRef.current.onerror = (error) => {
        console.error('Błąd połączenia SSE:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Próba ponownego połączenia (${retryCount}/${maxRetries})...`);
          setTimeout(() => {
            cleanupEventSource();
            createEventSource();
          }, 1000 * Math.pow(2, retryCount - 1));
        } else {
          console.error('Przekroczono limit prób połączenia');
          cleanupEventSource();
          setProcessingStatus({
            isProcessing: false,
            error: 'Utracono połączenie z serwerem'
          });
        }
      };
    };

    createEventSource();
  }, [cleanupEventSource, setProcessingStatus, calculateTotalProgress]);

  const processDocuments = async (files: File[], modelIds: string[]): Promise<ProcessingResult[]> => {
    const isSingleDocument = files.length === 1;
    let retryCount = 0;
    const maxRetries = 3;

    const tryProcessing = async (): Promise<ProcessingResult[]> => {
      try {
        abortControllerRef.current = new AbortController();
        
        const response = await fetch('/api/analyze/batch', {
          method: 'POST',
          body: createFormData(files, modelIds, sessionIdRef.current),
          headers: {
            'Accept': 'application/json',
          },
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Błąd HTTP: ${response.status}` }));
          throw new Error(errorData.message || `Błąd HTTP: ${response.status}`);
        }

        const results = await response.json();
        
        if (!results || !Array.isArray(results)) {
          throw new Error('Nieprawidłowy format odpowiedzi z serwera');
        }

        return results;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Przetwarzanie zostało przerwane');
        }

        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Próba ponownego przetwarzania (${retryCount}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
          return tryProcessing();
        }
        throw error;
      }
    };

    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null,
        progress: 0,
        isPaused: false,
        processedFiles: 0,
        totalFiles: files.length
      }));

      const initialStatus: BatchProcessingStatus = {
        isProcessing: true,
        currentFileIndex: 0,
        currentFileName: files[0]?.name ?? null,
        currentModelIndex: 0,
        currentModelId: modelIds[0] ?? null,
        fileProgress: 0,
        totalProgress: 0,
        totalFiles: files.length,
        results: [],
        error: null
      };

      setProcessingStatus(initialStatus);
      setupProgressTracking(isSingleDocument, files.length);
      const results = await tryProcessing();

      progressRef.current.results = results;
      progressRef.current.processedFiles = files.length;

      const finalStatus: BatchProcessingStatus = {
        isProcessing: false,
        currentFileIndex: files.length,
        currentFileName: null,
        currentModelIndex: modelIds.length,
        currentModelId: null,
        fileProgress: 100,
        totalProgress: 100,
        totalFiles: files.length,
        results,
        error: null
      };

      setProcessingStatus(finalStatus);
      return results;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd podczas przetwarzania';
      
      const errorStatus: BatchProcessingStatus = {
        isProcessing: false,
        currentFileIndex: progressRef.current.processedFiles,
        currentFileName: null,
        currentModelIndex: 0,
        currentModelId: null,
        fileProgress: 0,
        totalProgress: (progressRef.current.processedFiles / files.length) * 100,
        totalFiles: files.length,
        results: progressRef.current.results,
        error: errorMessage
      };

      setProcessingStatus(errorStatus);
      addToast('error', 'Błąd', errorMessage);
      throw error;

    } finally {
      cleanupEventSource();
      abortControllerRef.current = null;
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        progress: 0
      }));
    }
  };

  const pauseProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, isPaused: true }));
    setProcessingStatus({
      isProcessing: false,
      error: 'Przetwarzanie zostało wstrzymane'
    });
    addToast(
      'info',
      'Wstrzymano',
      'Przetwarzanie dokumentów zostało wstrzymane'
    );
  };

  const resumeProcessing = () => {
    setState(prev => ({ ...prev, isPaused: false }));
    setProcessingStatus({
      isProcessing: true,
      error: null
    });
    addToast(
      'info',
      'Wznowiono',
      'Przetwarzanie dokumentów zostało wznowione'
    );
  };

  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cleanupEventSource();
    setState(prev => ({ 
      ...prev, 
      isProcessing: false,
      isPaused: false,
      error: 'Przetwarzanie zostało anulowane'
    }));
    setProcessingStatus({
      isProcessing: false,
      error: 'Przetwarzanie zostało anulowane'
    });
    addToast(
      'info',
      'Anulowano',
      'Przetwarzanie dokumentów zostało anulowane'
    );
  };

  return {
    ...state,
    processDocuments,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing
  };
}

// Pomocnicze funkcje
const getOperationDescription = (
  stage: keyof typeof STAGE_WEIGHTS,
  details?: ProgressUpdate['details']
): string => {
  switch (stage) {
    case 'preparing':
      return 'Przygotowywanie dokumentu...';
    case 'reading':
      if (details?.page && details?.totalPages) {
        return `Odczytywanie strony ${details.page} z ${details.totalPages}...`;
      }
      return 'Odczytywanie dokumentu...';
    case 'analyzing':
      if (details?.currentField) {
        return `Analizowanie pola: ${details.currentField}...`;
      }
      return 'Analizowanie zawartości...';
    case 'extracting':
      return 'Wyodrębnianie danych...';
    case 'finalizing':
      return 'Finalizowanie przetwarzania...';
    default:
      return 'Przetwarzanie...';
  }
};

const createFormData = (files: File[], modelIds: string[], sessionId: string): FormData => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  modelIds.forEach(modelId => formData.append('modelId', modelId));
  formData.append('sessionId', sessionId);
  return formData;
}; 