'use client';

import useSWR from 'swr';
import type { ModelDefinition } from '@/types/processing';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Błąd pobierania modeli');
  }
  const data = await response.json();
  return data
    .filter((model: ModelDefinition) => !model.id.startsWith('prebuilt-'))
    .sort((a: ModelDefinition, b: ModelDefinition) => {
      const dateRegex = /model-(\d{8}-\d{6})/;
      const matchA = a.id.match(dateRegex);
      const matchB = b.id.match(dateRegex);

      if (matchA && matchB) {
        return matchB[1].localeCompare(matchA[1]);
      }

      return b.id.localeCompare(a.id);
    });
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