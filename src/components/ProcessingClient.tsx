'use client';

import * as React from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { FileUpload } from '@/components/FileUpload';
import { BatchProcessingResults } from '@/components/BatchProcessingResults';
import type { ModelDefinition, ProcessingResult } from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';

export function ProcessingClient() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<ProcessingResult[]>([]);
  const [batchId, setBatchId] = React.useState<string>('');

  const { data: models = [], isLoading, error } = useDocumentIntelligenceModels();

  // Rozpocznij nową partię przy starcie przetwarzania
  const handleProcessingStart = React.useCallback(() => {
    setResults([]);
    setBatchId(Date.now().toString());
  }, []);

  // Dodaj wyniki do aktualnej partii
  const handleProcessingComplete = React.useCallback((newResults: ProcessingResult[]) => {
    setResults(prev => {
      // Usuń poprzednie wyniki dla tych samych plików
      const existingFileNames = new Set(newResults.map(r => r.fileName));
      const filteredPrev = prev.filter(r => !existingFileNames.has(r.fileName));
      
      // Dodaj nowe wyniki
      return [...filteredPrev, ...newResults];
    });
  }, []);

  const handleExport = React.useCallback(() => {
    console.log('Eksport wyników:', results);
  }, [results]);

  return (
    <div className="space-y-8">
      <ModelSelector
        models={models}
        selectedModels={selectedModels}
        onModelSelect={setSelectedModels}
        disabled={isLoading}
        isLoading={isLoading}
        error={error}
      />
      
      {selectedModels.length > 0 && (
        <FileUpload
          modelIds={selectedModels}
          disabled={isLoading}
          onStart={handleProcessingStart}
          onComplete={handleProcessingComplete}
          batchId={batchId}
        />
      )}

      <BatchProcessingResults 
        results={results}
        onExport={handleExport}
      />
    </div>
  );
} 