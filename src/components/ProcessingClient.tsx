'use client';

import * as React from 'react';
import { ModelSelector } from '@/components/ModelSelector';
import { FileUpload } from '@/components/FileUpload';
import { BatchProcessingResults } from '@/components/BatchProcessingResults';
import { ProcessingSummary } from '@/components/ProcessingSummary';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, Server, Cpu } from 'lucide-react';
import type { 
  ModelDefinition, 
  ProcessingResult, 
  BatchProcessingStatus,
  AnalysisLogEntry 
} from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { calculateMedian, calculateConfidence } from '@/utils';
import { TimeCard } from './TimeCard';
import { AnalysisResultCard } from '@/components/AnalysisResultCard';

export function ProcessingClient() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [results, setResults] = React.useState<ProcessingResult[]>([]);
  const [batchId, setBatchId] = React.useState<string>('');
  const [isUploading, setIsUploading] = React.useState(false);
  const [currentAnalysis, setCurrentAnalysis] = React.useState<AnalysisLogEntry | null>(null);
  const [analysisLogs, setAnalysisLogs] = React.useState<AnalysisLogEntry[]>([]);
  const [currentTotalTime, setCurrentTotalTime] = React.useState(0);
  const [currentAzureTime, setCurrentAzureTime] = React.useState(0);
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
    <div className="space-y-6">
      <Card className="bg-white border">
        <CardHeader className="border-b">
          <CardTitle>Przygotowanie analizy</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div>
            <ModelSelector
              models={models}
              selectedModels={selectedModels}
              onModelSelect={setSelectedModels}
              disabled={isLoading || processingStatus.isProcessing}
              isLoading={isLoading}
              error={error}
            />
          </div>

          <div>
            <FileUpload
              modelIds={selectedModels}
              disabled={isLoading}
              onStart={handleProcessingStart}
              onComplete={handleProcessingComplete}
              batchId={batchId}
              status={processingStatus}
              onStatusUpdate={(status) => {
                if ('currentFileIndex' in status || 'currentModelIndex' in status) {
                  const fileIndex = status.currentFileIndex ?? processingStatus.currentFileIndex;
                  const modelIndex = status.currentModelIndex ?? processingStatus.currentModelIndex;
                  const totalFiles = processingStatus.totalFiles;
                  const totalModels = selectedModels.length;

                  const totalProgress = calculateProgress(fileIndex, modelIndex, totalFiles, totalModels);
                  const fileProgress = ((modelIndex ?? 0) + 1) / totalModels * 100;

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
          </div>
        </CardContent>
      </Card>
      
      {!processingStatus.isProcessing && results.length > 0 && (
        <div className="space-y-4">
          <Card className="bg-white border">
            <CardHeader className="border-b">
              <CardTitle>Podsumowanie analizy</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ProcessingSummary
                fileCount={results.length}
                totalTime={results.reduce((sum, r) => sum + (r.processingTime || 0), 0)}
                averageConfidence={results.reduce((sum, r) => {
                  if (!r.modelResults || r.modelResults.length === 0) return sum;
                  // Oblicz średnią pewność dla każdego modelu
                  const modelConfidences = r.modelResults.map(mr => {
                    // Jeśli model ma pola, oblicz średnią pewność pól
                    if (mr.fields && Object.keys(mr.fields).length > 0) {
                      const fieldConfidences = Object.values(mr.fields).map(f => f.confidence);
                      return fieldConfidences.reduce((a, b) => a + b, 0) / fieldConfidences.length;
                    }
                    // Jeśli nie ma pól, użyj ogólnej pewności modelu
                    return mr.confidence;
                  });
                  // Oblicz średnią z wszystkich modeli
                  return sum + (modelConfidences.reduce((a, b) => a + b, 0) / modelConfidences.length);
                }, 0) / Math.max(results.length, 1)}
                onExport={handleExport}
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {results.map((result, index) => (
              <AnalysisResultCard key={`${result.fileName}-${index}`} result={result} />
            ))}
          </div>
        </div>
      )}
      
      {(isUploading || currentAnalysis) && (
        <div className="bg-gray-900 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">Przetwarzanie</h3>
            <div className="flex items-center gap-2 text-gray-400">
              <FileText className="w-4 h-4" />
              <span>Przetworzone pliki: {Math.ceil(analysisLogs.length / selectedModels.length)}</span>
            </div>
          </div>
          
          {/* Czasy z wartościami średnimi i medianą */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <TimeCard
              title="Czas obróbki"
              icon={Clock}
              currentValue={currentTotalTime}
              lastValue={currentAnalysis?.timings.totalTime || 0}
              avgValue={analysisLogs.reduce((acc, log) => acc + log.timings.totalTime, 0) / Math.max(analysisLogs.length, 1)}
              medianValue={calculateMedian(analysisLogs.map(log => log.timings.totalTime))}
              recordValue={analysisLogs.length > 0 ? Math.min(...analysisLogs.map(log => log.timings.totalTime)) : Infinity}
            />
            <TimeCard
              title="Reakcja Azure"
              icon={Server}
              currentValue={currentAzureTime}
              lastValue={currentAnalysis?.timings.azureResponseTime || 0}
              avgValue={analysisLogs.reduce((acc, log) => acc + log.timings.azureResponseTime, 0) / Math.max(analysisLogs.length, 1)}
              medianValue={calculateMedian(analysisLogs.map(log => log.timings.azureResponseTime))}
              recordValue={analysisLogs.length > 0 ? Math.min(...analysisLogs.map(log => log.timings.azureResponseTime)) : Infinity}
            />
            <TimeCard
              title="Przetwarzanie"
              icon={Cpu}
              currentValue={0}
              lastValue={currentAnalysis?.timings.processingTime || 0}
              avgValue={analysisLogs.reduce((acc, log) => acc + log.timings.processingTime, 0) / Math.max(analysisLogs.length, 1)}
              medianValue={calculateMedian(analysisLogs.map(log => log.timings.processingTime))}
              recordValue={analysisLogs.length > 0 ? Math.min(...analysisLogs.map(log => log.timings.processingTime)) : Infinity}
            />
          </div>
        </div>
      )}
    </div>
  );
} 