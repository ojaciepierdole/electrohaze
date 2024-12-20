'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { FileList } from '@/components/FileList';
import { ModelSelector } from '@/components/ModelSelector';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { DocumentList } from '@/components/DocumentList';
import type { ProcessingResult, BatchProcessingStatus, ModelDefinition } from '@/types/processing';

export function ProcessingClient() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [documents, setDocuments] = useState<ProcessingResult[]>([]);
  const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<BatchProcessingStatus>({
    isProcessing: false,
    currentFileName: null,
    currentModelId: null,
    fileProgress: 0,
    totalProgress: 0,
    error: null,
    results: []
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pobierz modele przy pierwszym renderowaniu
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      setModelError(null);
      try {
        const response = await fetch('/api/models');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Błąd podczas pobierania modeli');
        }
        const models = await response.json();
        if (!Array.isArray(models)) {
          throw new Error('Nieprawidłowy format danych modeli');
        }
        setAvailableModels(models);
      } catch (error) {
        console.error('Błąd podczas pobierania modeli:', error);
        setModelError(error instanceof Error ? error.message : 'Nieznany błąd');
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, []);

  const handleFileRemove = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModels([modelId]); // Zawsze tylko jeden model
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files].slice(0, 20));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canStartProcessing = selectedFiles.length > 0 && selectedModels.length > 0;

  const handleStartProcessing = async () => {
    if (!canStartProcessing) return;

    setProcessingStatus(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      fileProgress: 0,
      totalProgress: 0,
      results: []
    }));

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('modelId', selectedModels[0]); // Używamy tylko pierwszego modelu
      formData.append('sessionId', Date.now().toString()); // Dodajemy ID sesji

      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Błąd podczas przetwarzania plików');
      }

      const results = await response.json();
      setDocuments(results);
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        results
      }));
    } catch (error) {
      console.error('Błąd przetwarzania:', error);
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Nieznany błąd'
      }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            onClick={handleFileButtonClick}
            disabled={processingStatus.isProcessing}
            className="w-full"
          >
            Wybierz pliki PDF (max. 20)
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf"
            onChange={handleFileInputChange}
            disabled={processingStatus.isProcessing}
          />
          <FileList
            files={selectedFiles}
            onRemove={handleFileRemove}
            isProcessing={processingStatus.isProcessing}
          />
        </div>

        {modelError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{modelError}</AlertDescription>
          </Alert>
        )}

        <ModelSelector
          models={availableModels}
          selectedModels={selectedModels}
          onSelect={handleModelSelect}
          disabled={processingStatus.isProcessing || isLoadingModels}
        />

        <Button
          onClick={handleStartProcessing}
          disabled={!canStartProcessing || processingStatus.isProcessing}
          className="w-full"
        >
          {processingStatus.isProcessing ? 'Przetwarzanie...' : 'Rozpocznij przetwarzanie'}
        </Button>

        {processingStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{processingStatus.error}</AlertDescription>
          </Alert>
        )}

        {processingStatus.isProcessing && (
          <ProcessingProgress
            currentFile={processingStatus.currentFileName}
            fileProgress={processingStatus.fileProgress}
            totalProgress={processingStatus.totalProgress}
            error={processingStatus.error}
          />
        )}
      </div>

      {documents.length > 0 && (
        <DocumentList 
          documents={documents}
          isProcessing={processingStatus.isProcessing}
        />
      )}
    </div>
  );
} 