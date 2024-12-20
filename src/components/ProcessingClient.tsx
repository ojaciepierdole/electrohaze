'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ModelSelector } from './ModelSelector';
import type { Model } from '@/types/models';
import { ChevronDown, ChevronUp, Loader2, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { DocumentList } from '@/components/DocumentList';
import { cn } from '@/lib/utils';

export function ProcessingClient() {
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('selectedModel');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFilesExpanded, setIsFilesExpanded] = useState(true);
  const [fileStats, setFileStats] = useState<{
    count: number;
    types: string[];
    totalSize: number;
    processingTime?: number;
    startTime?: number;
  } | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    const types = Array.from(new Set(acceptedFiles.map(file => file.type)));
    const totalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0);
    setFileStats(prev => ({
      count: (prev?.count || 0) + acceptedFiles.length,
      types: [...new Set([...(prev?.types || []), ...types])],
      totalSize: (prev?.totalSize || 0) + totalSize,
    }));
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  const removeFile = useCallback((index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      newFiles.splice(index, 1);
      
      // Aktualizuj statystyki
      if (fileStats) {
        const newTotalSize = fileStats.totalSize - removedFile.size;
        const remainingTypes = Array.from(new Set(newFiles.map(f => f.type)));
        setFileStats({
          ...fileStats,
          count: newFiles.length,
          types: remainingTypes,
          totalSize: newTotalSize,
        });
      }
      
      return newFiles;
    });
  }, [fileStats]);

  const removeAllFiles = useCallback(() => {
    setFiles([]);
    setFileStats(null);
  }, []);

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
    setProgress(0);
    setResults([]);
    setError(null);
    setIsFilesExpanded(false);
    
    // Zapisz czas rozpoczęcia
    const startTime = Date.now();
    setFileStats(prev => prev ? { ...prev, startTime } : null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('models[]', selectedModel);

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
      if (!data.sessionId) {
        throw new Error('Nie otrzymano identyfikatora sesji');
      }

      setSessionId(data.sessionId);
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

  const pollProgress = async (sid: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/analyze/progress?sessionId=${sid}`);
        
        if (!response.ok) {
          throw new Error(`Błąd podczas pobierania postępu: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
          setIsProcessing(false);
          toast({
            title: 'Błąd',
            description: data.error,
            variant: 'destructive'
          });
          return;
        }

        setProgress(data.progress || 0);

        if (data.status === 'success') {
          const endTime = Date.now();
          const processingTime = endTime - (fileStats?.startTime || endTime);
          
          setFileStats(prev => prev ? {
            ...prev,
            processingTime
          } : null);

          try {
            const resultsResponse = await fetch(`/api/analyze/results?sessionId=${sid}`);
            if (!resultsResponse.ok) {
              throw new Error('Błąd podczas pobierania wyników');
            }
            
            const resultsData = await resultsResponse.json();
            if (!resultsData.results || resultsData.results.length === 0) {
              throw new Error('Nie otrzymano żadnych wyników analizy');
            }

            setResults(resultsData.results);
            setIsProcessing(false);
            setFiles([]); // Czyścimy listę plików po zakończeniu analizy
            toast({
              title: 'Sukces',
              description: 'Przetwarzanie zakończone pomyślnie.',
              variant: 'default'
            });
          } catch (error) {
            handleError(error);
          }
          return;
        }

        if (data.status === 'error') {
          handleError(data.error || 'Wystąpił błąd podczas przetwarzania');
          return;
        }

        // Kontynuuj polling
        await new Promise(resolve => setTimeout(resolve, 1000));
        poll();

      } catch (error) {
        handleError(error);
      }
    };

    poll();
  };

  const handleError = (error: any) => {
    console.error('Błąd:', error);
    setError(error instanceof Error ? error.message : 'Wystąpił błąd');
    setIsProcessing(false);
    toast({
      title: 'Błąd',
      description: error instanceof Error ? error.message : 'Wystąpił błąd',
      variant: 'destructive'
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className={cn(
        "bg-slate-100 rounded-lg p-4 transition-all duration-300",
        !isFilesExpanded && "cursor-pointer hover:bg-slate-200"
      )}>
        {/* Header z podstawowymi informacjami */}
        <div 
          className="flex items-center justify-between"
          onClick={() => !isProcessing && setIsFilesExpanded(!isFilesExpanded)}
        >
          <div className="flex items-center space-x-4">
            <FileText className="h-5 w-5 text-slate-600" />
            <div>
              {fileStats ? (
                <div className="text-sm text-slate-600">
                  <span className="font-medium">{fileStats.count} {fileStats.count === 1 ? 'plik' : 'pliki'}</span>
                  <span className="mx-2">•</span>
                  <span>{(fileStats.totalSize / 1024 / 1024).toFixed(2)} MB</span>
                  {fileStats.processingTime && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{(fileStats.processingTime / 1000).toFixed(2)}s</span>
                    </>
                  )}
                  {isProcessing && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-blue-600">Przetwarzanie: {progress}%</span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-sm text-slate-600">Wybierz pliki do analizy</span>
              )}
            </div>
          </div>
          {!isProcessing && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsFilesExpanded(!isFilesExpanded);
              }}
            >
              {isFilesExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Rozwinięta zawartość */}
        {isFilesExpanded && (
          <div className="mt-4 space-y-4">
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelectionChange={setSelectedModel}
              isLoading={isLoading}
              disabled={isProcessing}
            />

            <div {...getRootProps()} className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors">
              <input {...getInputProps()} />
              <p className="text-sm text-slate-600">
                Przeciągnij i upuść pliki PDF tutaj lub kliknij, aby wybrać
              </p>
            </div>

            {files.length > 0 && (
              <div className="space-y-4">
                <div className="bg-white rounded-lg border">
                  <ScrollArea className="h-[200px]">
                    <DocumentList files={files} onRemove={removeFile} />
                  </ScrollArea>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={removeAllFiles}
                    disabled={isProcessing}
                    className="w-[140px]"
                  >
                    Usuń wszystkie
                  </Button>
                  <Button
                    onClick={startProcessing}
                    disabled={isProcessing || !selectedModel}
                    className="w-[140px]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Przetwarzanie...
                      </>
                    ) : (
                      'Rozpocznij analizę'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Pasek postępu */}
            {isProcessing && (
              <div className="space-y-2 bg-white rounded-lg p-4 border">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Postęp analizy</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wyniki analizy */}
      {sessionId && <DocumentList results={results} />}
    </div>
  );
} 