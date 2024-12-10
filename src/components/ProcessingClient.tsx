'use client';

import * as React from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { FileUpload } from '@/components/FileUpload';
import { BatchProcessingResults } from '@/components/BatchProcessingResults';
import type { ModelDefinition, ProcessingResult } from '@/types/processing';

export function ProcessingClient() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [models, setModels] = React.useState<ModelDefinition[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [results, setResults] = React.useState<ProcessingResult[]>([]);

  // Pobierz listę modeli przy pierwszym renderowaniu
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/models');
        if (!response.ok) {
          throw new Error('Nie udało się pobrać listy modeli');
        }
        const data = await response.json();
        setModels(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Nieznany błąd'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelSelect = React.useCallback((modelIds: string[]) => {
    if (modelIds.some(id => !id)) return;
    setSelectedModels(modelIds);
  }, []);

  const handleProcessingComplete = React.useCallback((newResults: ProcessingResult[]) => {
    setResults(prev => [...prev, ...newResults]);
  }, []);

  const handleExport = React.useCallback(() => {
    // Implementacja eksportu
    console.log('Eksport wyników:', results);
  }, [results]);

  return (
    <div className="space-y-8">
      <ModelSelector
        models={models}
        selectedModels={selectedModels}
        onModelSelect={handleModelSelect}
        isLoading={isLoading}
        error={error}
      />
      
      {selectedModels.length > 0 && (
        <FileUpload
          modelIds={selectedModels}
          disabled={isLoading}
          onComplete={handleProcessingComplete}
        />
      )}

      <BatchProcessingResults 
        results={results}
        onExport={handleExport}
      />
    </div>
  );
} 