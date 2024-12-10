'use client';

import * as React from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { FileUpload } from '@/components/FileUpload';
import { BatchProcessingResults } from '@/components/BatchProcessingResults';
import type { 
  ModelDefinition, 
  ProcessingResult, 
  BatchProcessingStatus 
} from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';

export function ProcessingClient() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<ProcessingResult[]>([]);
  const [batchId, setBatchId] = React.useState<string>('');
  const [processingStatus, setProcessingStatus] = React.useState<BatchProcessingStatus>({
    isProcessing: false,
    currentFileIndex: 0,
    currentFileName: null,
    currentModelIndex: 0,
    currentModelId: null,
    fileProgress: 0,
    totalProgress: 0,
    totalFiles: 0,
    results: [],
    error: null
  });

  const { data: models = [], isLoading, error } = useDocumentIntelligenceModels();

  // Rozpocznij nową partię przy starcie przetwarzania
  const handleProcessingStart = React.useCallback(() => {
    setResults([]);
    setBatchId(Date.now().toString());
    setProcessingStatus((prev: BatchProcessingStatus) => ({ 
      ...prev, 
      isProcessing: true 
    }));
  }, []);

  // Dodaj wyniki do aktualnej partii
  const handleProcessingComplete = React.useCallback((newResults: ProcessingResult[]) => {
    setResults((prev: ProcessingResult[]) => {
      // Usuń poprzednie wyniki dla tych samych plików
      const existingFileNames = new Set(newResults.map(r => r.fileName));
      const filteredPrev = prev.filter(r => !existingFileNames.has(r.fileName));
      
      // Dodaj nowe wyniki
      return [...filteredPrev, ...newResults];
    });
    setProcessingStatus((prev: BatchProcessingStatus) => ({ 
      ...prev, 
      isProcessing: false 
    }));
  }, []);

  const handleExport = React.useCallback(() => {
    console.log('Eksport wyników:', results);
  }, [results]);

  const updateProcessingStatus = (status: Partial<BatchProcessingStatus>) => {
    setProcessingStatus((prev: BatchProcessingStatus) => ({ ...prev, ...status }));
  };

  return (
    <div className="space-y-8">
      <FileUpload
        modelIds={selectedModels}
        disabled={isLoading}
        onStart={handleProcessingStart}
        onComplete={handleProcessingComplete}
        batchId={batchId}
        status={processingStatus}
        onStatusUpdate={updateProcessingStatus}
      />

      <ModelSelector
        models={models}
        selectedModels={selectedModels}
        onModelSelect={setSelectedModels}
        disabled={isLoading}
        isLoading={isLoading}
        error={error}
      />
      
      {!processingStatus.isProcessing && results.length > 0 && (
        <BatchProcessingResults 
          results={results}
          onExport={handleExport}
        />
      )}
    </div>
  );
} 