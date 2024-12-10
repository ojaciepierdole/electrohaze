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
import { compressFiles } from '@/utils/compression';
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ProgressIndicator = ({ 
  status, 
  totalModels 
}: { 
  status: BatchProcessingStatus;
  totalModels: number;
}) => {
  if (!status.isProcessing) return null;

  return (
    <Card className="w-full bg-white shadow-lg">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-xl font-bold">Status przetwarzania</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <span>Całkowity postęp</span>
            <span className="text-primary font-bold">{Math.round(status.totalProgress)}%</span>
          </div>
          <div className="relative w-full">
            <Progress 
              value={status.totalProgress} 
              className="h-4 w-full"
            />
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Przetworzono {status.currentFileIndex * totalModels + (status.currentModelIndex + 1)} z {status.totalFiles * totalModels} operacji
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between text-base font-medium">
            <span className="truncate max-w-[80%]">
              {status.currentFileName 
                ? `Przetwarzanie: ${status.currentFileName}`
                : 'Przygotowywanie plików...'}
            </span>
            <span className="text-primary font-bold">{Math.round(status.fileProgress)}%</span>
          </div>
          <div className="relative w-full">
            <Progress 
              value={status.fileProgress} 
              className="h-4 w-full"
            />
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Model {status.currentModelIndex + 1} z {totalModels} | Plik {status.currentFileIndex + 1} z {status.totalFiles}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

  // Obliczamy całkowity postęp na podstawie plików i modeli
  const calculateProgress = React.useCallback((fileIndex: number, modelIndex: number, totalFiles: number, totalModels: number) => {
    // Całkowita liczba operacji to liczba plików * liczba modeli
    const totalOperations = totalFiles * totalModels;
    // Aktualny numer operacji to (fileIndex * totalModels) + modelIndex
    const currentOperation = (fileIndex * totalModels) + modelIndex;
    // Obliczamy procent postępu
    return (currentOperation / totalOperations) * 100;
  }, []);

  const handleProcessingStart = React.useCallback(() => {
    console.log('Rozpoczynam przetwarzanie');
    setResults([]);
    setBatchId(Date.now().toString());
  }, []);

  const handleProcessingComplete = React.useCallback((newResults: ProcessingResult[]) => {
    console.log('Zakończono przetwarzanie', newResults);
    setResults((prev: ProcessingResult[]) => {
      const existingFileNames = new Set(newResults.map(r => r.fileName));
      const filteredPrev = prev.filter(r => !existingFileNames.has(r.fileName));
      return [...filteredPrev, ...newResults];
    });
  }, []);

  const handleExport = React.useCallback(() => {
    console.log('Eksport wyników:', results);
  }, [results]);

  return (
    <div className="space-y-8">
      <FileUpload
        modelIds={selectedModels}
        disabled={isLoading}
        onStart={handleProcessingStart}
        onComplete={handleProcessingComplete}
        batchId={batchId}
        status={processingStatus}
        onStatusUpdate={(status) => {
          // Jeśli aktualizujemy indeksy, przeliczamy postęp
          if ('currentFileIndex' in status || 'currentModelIndex' in status) {
            const fileIndex = 'currentFileIndex' in status ? status.currentFileIndex : processingStatus.currentFileIndex;
            const modelIndex = 'currentModelIndex' in status ? status.currentModelIndex : processingStatus.currentModelIndex;
            const totalFiles = processingStatus.totalFiles;
            const totalModels = selectedModels.length;

            const totalProgress = calculateProgress(fileIndex, modelIndex, totalFiles, totalModels);
            const fileProgress = (modelIndex + 1) / totalModels * 100;

            setProcessingStatus(prev => ({
              ...prev,
              ...status,
              totalProgress,
              fileProgress
            }));
          } else {
            setProcessingStatus(prev => ({ ...prev, ...status }));
          }
        }}
      />

      <ModelSelector
        models={models}
        selectedModels={selectedModels}
        onModelSelect={setSelectedModels}
        disabled={isLoading || processingStatus.isProcessing}
        isLoading={isLoading}
        error={error}
      />
      
      {processingStatus.isProcessing && (
        <div className="relative">
          <ProgressIndicator 
            status={processingStatus}
            totalModels={selectedModels.length}
          />
        </div>
      )}
      
      {!processingStatus.isProcessing && results.length > 0 && (
        <BatchProcessingResults 
          results={results}
          onExport={handleExport}
        />
      )}
    </div>
  );
} 