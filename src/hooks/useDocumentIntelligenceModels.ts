'use client';

import { useState, useEffect } from 'react';
import type { ModelDefinition } from '@/types/processing';

export function useDocumentIntelligenceModels() {
  const [data, setData] = useState<ModelDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Pobierz listę modeli
        const modelsResponse = await fetch('/api/models');
        if (!modelsResponse.ok) {
          throw new Error('Błąd podczas pobierania modeli');
        }
        const models = await modelsResponse.json();

        // Dla każdego modelu pobierz jego pola
        const modelsWithFields = await Promise.all(
          models.map(async (model: any) => {
            const fieldsResponse = await fetch(`/api/models/${model.modelId}/fields`);
            if (!fieldsResponse.ok) {
              throw new Error(`Błąd podczas pobierania pól dla modelu ${model.modelId}`);
            }
            const fields = await fieldsResponse.json();

            return {
              id: model.modelId,
              name: model.description || model.modelId,
              description: `Model ID: ${model.modelId}`,
              fields
            };
          })
        );

        setData(modelsWithFields);
      } catch (err) {
        console.error('Błąd:', err);
        setError(err instanceof Error ? err : new Error('Wystąpił nieznany błąd'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  return { data, isLoading, error };
} 