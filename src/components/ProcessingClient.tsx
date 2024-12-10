'use client';

import React from 'react';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { BatchProcessingControls } from './BatchProcessingControls';
import { BatchProcessingResults } from './BatchProcessingResults';
import { Card } from '@/components/ui/card';
import type { ProcessingResult, BatchProcessingStatus } from '@/types/processing';
import { checkPositiveBaseline, checkTopScore } from '@/utils/processing';

export function ProcessingClient() {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [selectedModelIds, setSelectedModelIds] = React.useState<string[]>([]);
  const { data: availableModels = [], isLoading: isLoadingModels, error: modelsError } = useDocumentIntelligenceModels();
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const [status, setStatus] = React.useState<BatchProcessingStatus>({
    isProcessing: false,
    currentFileIndex: 0,
    currentFileName: '',
    currentModelIndex: 0,
    currentModelId: '',
    fileProgress: 0,
    totalProgress: 0,
    results: []
  });

  const processFile = async (file: File, modelId: string): Promise<ProcessingResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('modelId', modelId);

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      throw new Error(`Błąd przetwarzania: ${response.statusText}`);
    }

    const data = await response.json();
    console.group('Analiza dokumentu');
    console.log('Plik:', file.name);
    console.log('Model:', modelId);
    console.log('Wyniki:', data);
    console.groupEnd();

    return {
      fileName: file.name,
      modelId,
      processingTime: data.processingTime,
      supplierName: data.result.supplierName,
      fields: data.raw,
      positiveBaseline: checkPositiveBaseline(data.raw),
      topScore: checkTopScore(data.raw)
    };
  };

  const startProcessing = async () => {
    if (status.isProcessing) return;
    
    abortControllerRef.current = new AbortController();
    setStatus(prev => ({ ...prev, isProcessing: true }));

    try {
      const results: ProcessingResult[] = [];
      let totalFiles = selectedFiles.length * selectedModelIds.length;
      let processed = 0;

      for (let fileIndex = 0; fileIndex < selectedFiles.length; fileIndex++) {
        const file = selectedFiles[fileIndex];
        
        for (let modelIndex = 0; modelIndex < selectedModelIds.length; modelIndex++) {
          const modelId = selectedModelIds[modelIndex];
          
          setStatus(prev => ({
            ...prev,
            currentFileIndex: fileIndex,
            currentFileName: file.name,
            currentModelIndex: modelIndex,
            currentModelId: modelId,
            fileProgress: 0
          }));

          const result = await processFile(file, modelId);
          results.push(result);
          processed++;

          setStatus(prev => ({
            ...prev,
            fileProgress: 100,
            totalProgress: (processed / totalFiles) * 100,
            results
          }));
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Błąd przetwarzania:', error.message);
      }
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
      abortControllerRef.current = null;
    }
  };

  const stopProcessing = () => {
    abortControllerRef.current?.abort();
  };

  const handleExport = () => {
    const csvContent = status.results.map(result => {
      const baseData = {
        fileName: result.fileName,
        modelId: result.modelId,
        processingTime: result.processingTime,
        positiveBaseline: result.positiveBaseline,
        topScore: result.topScore
      };

      // Dodaj wszystkie pola z dokumentu
      const fieldData = Object.entries(result.fields).reduce((acc, [key, field]) => ({
        ...acc,
        [`${key}_value`]: field.content,
        [`${key}_confidence`]: field.confidence
      }), {});

      return { ...baseData, ...fieldData };
    });

    // Konwertuj do CSV i pobierz
    const headers = Object.keys(csvContent[0]);
    const csv = [
      headers.join(','),
      ...csvContent.map(row => 
        headers.map(header => JSON.stringify(row[header as keyof typeof row])).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'analiza_dokumentow.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <BatchProcessingControls
          files={selectedFiles}
          onFilesChange={setSelectedFiles}
          selectedModels={selectedModelIds}
          onModelSelect={setSelectedModelIds}
          onStart={startProcessing}
          onStop={stopProcessing}
          isProcessing={status.isProcessing}
          models={availableModels}
          isLoadingModels={isLoadingModels}
          modelsError={modelsError}
        />
      </Card>

      {status.results.length > 0 && (
        <BatchProcessingResults 
          results={status.results}
          onExport={handleExport}
        />
      )}
    </div>
  );
} 