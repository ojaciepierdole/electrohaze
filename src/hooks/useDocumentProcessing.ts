import { useState, useCallback } from 'react';
import type { ProcessingResult, ProcessingProgress } from '@/types/processing';

interface UseDocumentProcessingOptions {
  onProgress?: (progress: ProcessingProgress) => void;
}

export function useDocumentProcessing(options: UseDocumentProcessingOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<ProcessingProgress>();
  const [currentOperation, setCurrentOperation] = useState<string>();

  const processDocuments = useCallback(async (
    files: File[],
    models: string[]
  ): Promise<ProcessingResult[]> => {
    setIsProcessing(true);
    setError(undefined);
    setProgress(undefined);
    setCurrentOperation('Rozpoczynam przetwarzanie...');

    try {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      models.forEach(model => formData.append('models', model));

      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Błąd podczas przetwarzania dokumentów');
      }

      const sessionId = await response.text();
      const eventSource = new EventSource(`/api/analyze/progress?sessionId=${sessionId}`);

      return new Promise((resolve, reject) => {
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data) as ProcessingProgress;
          setProgress(data);
          options.onProgress?.(data);

          if (data.totalProgress === 100) {
            eventSource.close();
            resolve(data.results || []);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE Error:', error);
          eventSource.close();
          reject(new Error('Błąd podczas odbierania postępu przetwarzania'));
        };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
      setCurrentOperation(undefined);
    }
  }, [options]);

  return {
    isProcessing,
    error,
    progress,
    currentOperation,
    processDocuments
  };
} 