import { useState, useCallback, useRef, useEffect } from 'react';
import { insertDocumentWithData, DocumentInsertData } from '@/lib/supabase/document-helpers';
import { useToast } from '@/hooks/useToast';
import { useProcessingStore } from '@/stores/processing-store';
import type { ProcessingResult, BatchProcessingStatus } from '@/types/processing';

interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
  progress: number;
  lastSavedDocument: DocumentInsertData | null;
  isPaused: boolean;
}

export function useDocumentProcessing() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    error: null,
    progress: 0,
    lastSavedDocument: null,
    isPaused: false,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const { addToast } = useToast();
  const setProcessingStatus = useProcessingStore(state => state.setProcessingStatus);

  const cleanupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('Cleaning up EventSource');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupEventSource();
    };
  }, [cleanupEventSource]);

  const setupProgressTracking = () => {
    cleanupEventSource();

    const url = `/api/analyze/progress?sessionId=${sessionIdRef.current}`;
    console.log('Setting up EventSource:', url);
    eventSourceRef.current = new EventSource(url);
    
    eventSourceRef.current.onopen = () => {
      console.log('EventSource connection opened');
    };
    
    eventSourceRef.current.onmessage = (event) => {
      console.log('Received SSE message:', event.data);
      try {
        const data = JSON.parse(event.data);
        
        if (data.totalFiles === 1) {
          const progress = data.fileProgress || 0;
          setProcessingStatus({
            ...data,
            fileProgress: progress,
            totalProgress: progress
          });
          
          setState(prev => ({
            ...prev,
            progress: progress
          }));
        } else {
          setProcessingStatus(data);
          setState(prev => ({
            ...prev,
            progress: data.totalProgress
          }));
        }
      } catch (error) {
        console.error('Błąd parsowania danych SSE:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('EventSource error:', error);
      cleanupEventSource();
    };
  };

  const processDocuments = async (files: File[], modelIds: string[]): Promise<ProcessingResult[]> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null,
        progress: 0,
        isPaused: false
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

      console.log('Initializing processing status:', initialStatus);
      setProcessingStatus(initialStatus);

      setupProgressTracking();

      abortControllerRef.current = new AbortController();
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      modelIds.forEach(modelId => {
        formData.append('modelId', modelId);
      });
      formData.append('sessionId', sessionIdRef.current);

      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Błąd podczas przetwarzania dokumentów');
      }

      const results = await response.json();
      
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

      console.log('Setting final status:', finalStatus);
      setProcessingStatus(finalStatus);
      setState(prev => ({ ...prev, progress: 100, isProcessing: false }));

      cleanupEventSource();

      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        const abortStatus: BatchProcessingStatus = {
          isProcessing: false,
          currentFileIndex: 0,
          currentFileName: null,
          currentModelIndex: 0,
          currentModelId: null,
          fileProgress: 0,
          totalProgress: 0,
          totalFiles: 0,
          results: [],
          error: 'Przetwarzanie zostało anulowane'
        };

        setState(prev => ({
          ...prev,
          error: abortStatus.error,
          isProcessing: false,
          isPaused: false
        }));
        setProcessingStatus(abortStatus);

        addToast(
          'info',
          'Anulowano',
          'Przetwarzanie dokumentów zostało anulowane'
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd podczas przetwarzania';
        const errorStatus: BatchProcessingStatus = {
          isProcessing: false,
          currentFileIndex: 0,
          currentFileName: null,
          currentModelIndex: 0,
          currentModelId: null,
          fileProgress: 0,
          totalProgress: 0,
          totalFiles: 0,
          results: [],
          error: errorMessage
        };

        setState(prev => ({
          ...prev,
          error: errorMessage,
          isProcessing: false
        }));
        setProcessingStatus(errorStatus);

        addToast(
          'error',
          'Błąd',
          errorMessage
        );
      }

      cleanupEventSource();
      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      setProcessingStatus({
        isProcessing: false,
        currentFileName: null,
        currentModelId: null,
        fileProgress: 0,
        totalProgress: 0
      });
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  const pauseProcessing = () => {
    setState(prev => ({ ...prev, isPaused: true }));
    setProcessingStatus({
      isProcessing: false
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
      isProcessing: true
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
      abortControllerRef.current = null;
    }
    cleanupEventSource();
    setState(prev => ({ 
      ...prev, 
      isProcessing: false, 
      isPaused: false,
      progress: 0 
    }));
    setProcessingStatus({
      isProcessing: false,
      currentFileName: null,
      currentModelId: null,
      fileProgress: 0,
      totalProgress: 0,
      results: []
    });
  };

  const saveDocument = async (documentData: DocumentInsertData) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null,
        lastSavedDocument: documentData
      }));
      
      setState(prev => ({ ...prev, progress: 30 }));
      
      const savedDocument = await insertDocumentWithData(documentData);
      
      setState(prev => ({ ...prev, progress: 100 }));
      
      addToast(
        'success',
        'Dokument zapisany',
        'Dokument został pomyślnie zapisany w bazie danych.'
      );

      return savedDocument;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Nieznany błąd',
        lastSavedDocument: null
      }));

      addToast(
        'error',
        'Błąd zapisu',
        error instanceof Error ? error.message : 'Wystąpił nieznany błąd podczas zapisu dokumentu.'
      );

      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
      setProcessingStatus({
        isProcessing: false
      });
    }
  };

  return {
    ...state,
    saveDocument,
    processDocuments,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
  };
} 