'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModelSelector } from './ModelSelector';
import { AnalysisResultCard } from './AnalysisResultCard';
import { AnalysisResult } from '@/lib/types';
import type { Model } from '@/types/models';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export function ProcessingClient() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);

  // Załaduj listę modeli
  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/models');
      if (!response.ok) {
        throw new Error('Nie udało się pobrać listy modeli');
      }
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Błąd podczas ładowania modeli:', error);
      toast({
        title: 'Błąd',
        description: 'Nie udało się załadować listy modeli.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Obsługa upuszczania plików
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  // Usuwanie plików
  const removeFile = useCallback((file: File) => {
    setFiles(prev => prev.filter(f => f !== file));
  }, []);

  const removeAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Rozpoczęcie przetwarzania
  const startProcessing = async () => {
    if (!files.length || !selectedModels.length) {
      toast({
        title: 'Błąd',
        description: 'Wybierz pliki i model przed rozpoczęciem analizy.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setIsFilesExpanded(false);
    setProgress(0);
    setResults([]);
    setError(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    selectedModels.forEach(model => formData.append('models', model));

    try {
      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Błąd podczas przetwarzania plików');
      }

      const { sessionId } = await response.json();
      setSessionId(sessionId);

      // Rozpocznij polling postępu
      pollProgress(sessionId);

    } catch (error) {
      console.error('Błąd podczas przetwarzania:', error);
      setError('Wystąpił błąd podczas przetwarzania plików');
      setIsProcessing(false);
      setIsFilesExpanded(true);
    }
  };

  // Polling postępu
  const pollProgress = async (sid: string) => {
    try {
      const response = await fetch(`/api/analyze/progress?sessionId=${sid}`);
      if (!response.ok) throw new Error('Błąd podczas pobierania postępu');
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setIsProcessing(false);
        setIsFilesExpanded(true);
        return;
      }

      if (data.progress !== undefined) {
        setProgress(data.progress);
      }

      if (data.status === 'success') {
        // Pobierz wyniki po zakończeniu przetwarzania
        const resultsResponse = await fetch(`/api/analyze/results?sessionId=${sid}`);
        if (!resultsResponse.ok) throw new Error('Błąd podczas pobierania wyników');
        
        const resultsData = await resultsResponse.json();
        setResults(resultsData.results || []);
        setIsProcessing(false);
        setIsFilesExpanded(true);
        return;
      }

      if (data.status === 'error') {
        setError(data.error || 'Wystąpił błąd podczas przetwarzania');
        setIsProcessing(false);
        setIsFilesExpanded(true);
        return;
      }

      // Kontynuuj polling jeśli przetwarzanie nadal trwa
      setTimeout(() => pollProgress(sid), 1000);

    } catch (error) {
      console.error('Błąd podczas pollingu:', error);
      setError('Wystąpił błąd podczas przetwarzania');
      setIsProcessing(false);
      setIsFilesExpanded(true);
    }
  };

  // Wyświetl błąd
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-red-500">
          Błąd: {error}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Strefa upuszczania plików */}
      <Card className="p-4">
        <div {...getRootProps()} className="space-y-4">
          <input {...getInputProps()} />
          <div
            className={`
              border-2 border-dashed rounded-lg p-6
              flex flex-col items-center justify-center gap-2
              cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            `}
          >
            <p className="text-sm text-center text-muted-foreground">
              {isDragActive
                ? 'Upuść pliki tutaj...'
                : 'Przeciągnij i upuść pliki PDF tutaj lub kliknij aby wybrać'}
            </p>
          </div>
        </div>
      </Card>

      {/* Lista plików */}
      {files.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilesExpanded(!isFilesExpanded)}
                  className="p-0 h-auto"
                >
                  {isFilesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <h3 className="text-sm font-medium">Pliki ({files.length})</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeAllFiles}
                disabled={isProcessing}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń wszystkie
              </Button>
            </div>
            {isFilesExpanded && (
              <div className="divide-y max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-1 hover:bg-gray-50">
                    <span className="text-sm truncate flex-1 mr-2">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file)}
                      disabled={isProcessing}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Wybór modelu */}
      <ModelSelector
        selectedModels={selectedModels}
        onSelect={(modelId) => setSelectedModels([modelId])}
        disabled={isProcessing}
        models={models}
        isLoading={isLoading}
      />

      {/* Postęp przetwarzania */}
      {isProcessing && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Przetwarzanie plików...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            <div className="text-sm text-muted-foreground">
              {progress < 100 ? (
                <>
                  <p>• Przesyłanie plików do Azure Document Intelligence</p>
                  <p>• Analiza dokumentów w toku</p>
                  <p>• Oczekiwanie na wyniki</p>
                </>
              ) : (
                <p>Zakończono przetwarzanie!</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Przycisk rozpoczęcia */}
      <Button
        className="w-full"
        disabled={!files.length || !selectedModels.length || isProcessing}
        onClick={startProcessing}
      >
        {isProcessing ? 'Przetwarzanie...' : 'Rozpocznij analizę'}
      </Button>

      {/* Wyniki */}
      {results.map((result, index) => (
        <AnalysisResultCard key={index} result={result} />
      ))}
    </div>
  );
} 