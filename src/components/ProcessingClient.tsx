'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModelSelector } from './ModelSelector';
import { AnalysisResultCard } from './AnalysisResultCard';
import { AnalysisResult } from '@/lib/types';
import type { Model } from '@/types/models';
import { ChevronDown, ChevronUp, Upload, Trash2, X } from 'lucide-react';

export function ProcessingClient() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(() => {
    // Wczytaj zapisany wybór modelu
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel');
    }
    return null;
  });
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

  // Zapisz wybór modelu
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedModel) {
      localStorage.setItem('selectedModel', selectedModel);
    }
  }, [selectedModel]);

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

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
    // Tymczasowo wyłączone buforowanie plików
  }, []);

  // Usuwanie plików
  const removeFile = useCallback((file: File) => {
    setFiles(prev => prev.filter(f => f !== file));
  }, []);

  const removeAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Rozpoczęcie przetwarzania
  const startProcessing = async () => {
    if (!files.length || !selectedModel) {
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
    formData.append('models[]', selectedModel);

    console.log('Wysyłane pliki:', files.map(f => f.name));
    console.log('Wysyłany model:', selectedModel);
    console.log('FormData keys:', Array.from(formData.keys()));

    try {
      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Wystąpił błąd podczas przetwarzania');
      }

      const data = await response.json();
      console.log('Odpowiedź z serwera:', data);
      
      if (!data.sessionId) {
        throw new Error('Nie otrzymano identyfikatora sesji');
      }

      setSessionId(data.sessionId);
      // Dodajemy opóźnienie przed rozpoczęciem pollingu
      await new Promise(resolve => setTimeout(resolve, 1000));
      pollProgress(data.sessionId);

    } catch (error) {
      console.error('Błąd podczas przetwarzania:', error);
      setError('Wystąpił błąd podczas przetwarzania plików');
      setIsProcessing(false);
      setIsFilesExpanded(true);
      toast({
        title: 'Błąd',
        description: 'Wystąpił błąd podczas przetwarzania plików.',
        variant: 'destructive'
      });
    }
  };

  // Polling postępu
  const pollProgress = async (sid: string) => {
    let retryCount = 0;
    const maxRetries = 15;
    const retryDelay = 2000;

    const poll = async () => {
      try {
        console.log(`[${new Date().toISOString()}] Próba pobrania postępu (${retryCount + 1}/${maxRetries}), sessionId: ${sid}`);
        const response = await fetch(`/api/analyze/progress?sessionId=${sid}`);
        
        if (!response.ok) {
          console.error(`[${new Date().toISOString()}] Błąd odpowiedzi:`, {
            status: response.status,
            statusText: response.statusText,
            sessionId: sid
          });
          
          if (response.status === 404) {
            console.log(`[${new Date().toISOString()}] Sesja ${sid} nie jest jeszcze gotowa`);
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return poll();
            } else {
              throw new Error('Przekroczono limit prób pobierania postępu');
            }
          }
          throw new Error(`Błąd podczas pobierania postępu: ${response.status}`);
        }

        // Resetujemy licznik prób po udanym żądaniu
        retryCount = 0;
        
        const data = await response.json();
        console.log(`[${new Date().toISOString()}] Otrzymane dane:`, data);
        
        if (data.error) {
          console.error('Błąd postępu:', data.error);
          setError(data.error);
          setIsProcessing(false);
          setIsFilesExpanded(true);
          toast({
            title: 'Błąd',
            description: data.error,
            variant: 'destructive'
          });
          return;
        }

        if (data.progress !== undefined && data.progress > progress) {
          setProgress(data.progress);
        }

        if (data.status === 'success') {
          console.log('Status success - pobieram wyniki');
          setProgress(100);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          try {
            const resultsResponse = await fetch(`/api/analyze/results?sessionId=${sid}`);
            if (!resultsResponse.ok) {
              throw new Error('Błąd podczas pobierania wyników');
            }
            
            const resultsData = await resultsResponse.json();
            console.log('Pobrane wyniki:', resultsData);
            
            if (!resultsData.results || resultsData.results.length === 0) {
              console.error('Otrzymano pustą tablicę wyników');
              throw new Error('Nie otrzymano żadnych wyników analizy');
            }

            setResults(resultsData.results);
            setIsProcessing(false);
            setIsFilesExpanded(true);
            setFiles([]); // Czyścimy listę plików po zakończeniu analizy
            toast({
              title: 'Sukces',
              description: 'Przetwarzanie zakończone pomyślnie.',
              variant: 'default'
            });
          } catch (error) {
            console.error('Błąd podczas pobierania wyników:', error);
            setIsProcessing(false);
            setIsFilesExpanded(true);
            toast({
              title: 'Błąd',
              description: error instanceof Error ? error.message : 'Wystąpił błąd podczas pobierania wyników.',
              variant: 'destructive'
            });
          }
          return;
        }

        if (data.status === 'error') {
          setError(data.error || 'Wystąpił błąd podczas przetwarzania');
          setIsProcessing(false);
          setIsFilesExpanded(true);
          toast({
            title: 'Błąd',
            description: data.error || 'Wystąpił błąd podczas przetwarzania',
            variant: 'destructive'
          });
          return;
        }

        // Kontynuuj polling
        await new Promise(resolve => setTimeout(resolve, 1000));
        poll();

      } catch (error) {
        console.error('Błąd podczas pollingu:', error);
        setError('Wystąpił błąd podczas przetwarzania');
        setIsProcessing(false);
        setIsFilesExpanded(true);
        toast({
          title: 'Błąd',
          description: 'Wystąpił błąd podczas przetwarzania.',
          variant: 'destructive'
        });
      }
    };

    // Rozpocznij polling
    poll();
  };

  return (
    <div className="container max-w-3xl mx-auto space-y-4">
      {/* Selektor modeli */}
      <ModelSelector
        models={models}
        selectedModel={selectedModel}
        onSelectionChange={setSelectedModel}
        isLoading={isLoading}
        disabled={isProcessing}
      />

      {/* Przycisk wgrywania plików */}
      <Card className="p-4">
        <div className="space-y-4">
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Button
            onClick={() => document.getElementById('file-upload')?.click()}
            className="w-full"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            Wgraj pliki
          </Button>
        </div>
      </Card>

      {/* Lista plików */}
      {files.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            <div
              onClick={() => setIsFilesExpanded(!isFilesExpanded)}
              className="flex justify-between items-center w-full hover:bg-gray-50 p-2 rounded-md cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isFilesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                <h3 className="text-sm font-medium">Pliki ({files.length})</h3>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAllFiles();
                }}
                disabled={isProcessing}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
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
                      size="icon"
                      onClick={() => removeFile(file)}
                      disabled={isProcessing}
                      className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Przycisk rozpoczęcia przetwarzania */}
      <div className="flex justify-end">
        <Button
          onClick={startProcessing}
          disabled={isProcessing || !files.length || !selectedModel}
        >
          {isProcessing ? 'Przetwarzanie...' : 'Rozpocznij analizę'}
        </Button>
      </div>

      {/* Pasek postępu */}
      {isProcessing && (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Postęp analizy</span>
              <span className="text-sm text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>
      )}

      {/* Wyniki */}
      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <AnalysisResultCard key={index} result={result} />
          ))}
        </div>
      )}
    </div>
  );
} 