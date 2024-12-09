'use client';

import { useState, useEffect } from 'react';
import { DocumentIntelligenceResponse, DocumentIntelligenceModel } from '@/types/documentIntelligence';

interface UseDocumentIntelligenceModelsReturn {
  data: DocumentIntelligenceModel[] | null;
  isLoading: boolean;
  error: Error | null;
}

export function useDocumentIntelligenceModels(): UseDocumentIntelligenceModelsReturn {
  const [data, setData] = useState<DocumentIntelligenceModel[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/document-intelligence/models');
        if (!response.ok) {
          throw new Error('Nie udało się pobrać modeli');
        }
        const data: DocumentIntelligenceResponse = await response.json();
        setData(data.models);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Wystąpił nieznany błąd'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { data, isLoading, error };
} 