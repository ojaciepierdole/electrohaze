'use client';

import useSWR from 'swr';
import type { ModelDefinition } from '@/types/processing';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Błąd pobierania modeli');
  }
  const data = await response.json();
  return data.filter((model: ModelDefinition) => !model.id.startsWith('prebuilt-'));
};

export function useDocumentIntelligenceModels() {
  const { data = [], error, isLoading } = useSWR<ModelDefinition[]>(
    '/api/models',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000,
      fallbackData: []
    }
  );

  return {
    data,
    isLoading,
    error
  };
} 