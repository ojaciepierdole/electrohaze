import { useState, useCallback, useRef, useEffect } from 'react';
import { insertDocumentWithData, DocumentInsertData } from '@/lib/supabase/document-helpers';
import { useToast } from '@/hooks/useToast';
import { useProcessingStore } from '@/stores/processing-store';
import type { ProcessingResult } from '@/types/processing';

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

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const setupProgressTracking = () => {
    if (eventSourceRef.current) {
      console.log('Closing existing EventSource');
      eventSourceRef.current.close();
    }

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
        setProcessingStatus(data);
      } catch (error) {
        console.error('Błąd parsowania danych SSE:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('EventSource error:', error);
      if (eventSourceRef.current) {
        console.log('Closing EventSource due to error');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
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

      setProcessingStatus({
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
      });

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
      setState(prev => ({ ...prev, progress: 100 }));

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      return results;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          error: 'Przetwarzanie zostało anulowane',
          isProcessing: false,
          isPaused: false
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
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Nieznany błąd podczas przetwarzania';
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
        setProcessingStatus({
          isProcessing: false,
          error: errorMessage
        });
        addToast(
          'error',
          'Błąd',
          errorMessage
        );
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const pauseProcessing = () => {
    setState(prev => ({ ...prev, isPaused: true }));
    // TODO: Implement actual pause functionality on the backend
    addToast(
      'info',
      'Wstrzymano',
      'Przetwarzanie dokumentów zostało wstrzymane'
    );
  };

  const resumeProcessing = () => {
    setState(prev => ({ ...prev, isPaused: false }));
    // TODO: Implement actual resume functionality on the backend
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
    setState(prev => ({ 
      ...prev, 
      isProcessing: false, 
      isPaused: false,
      progress: 0 
    }));
  };

  const saveDocument = async (documentData: DocumentInsertData) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null,
        lastSavedDocument: documentData // Optymistyczna aktualizacja
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
        lastSavedDocument: null // Cofnij optymistyczną aktualizację
      }));

      addToast(
        'error',
        'Błąd zapisu',
        error instanceof Error ? error.message : 'Wystąpił nieznany błąd podczas zapisu dokumentu.'
      );

      throw error;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
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