'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Play, Pause, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectedFilesList } from '@/components/SelectedFilesList';
import { DocumentScanner } from '@/components/DocumentScanner';
import type { ProcessingResult, BatchProcessingStatus } from '@/types/processing';
import { ProcessingStatus } from '@/components/ProcessingStatus';

interface FileUploadProps {
  modelIds: string[];
  disabled?: boolean;
  onComplete: (results: ProcessingResult[]) => void;
}

export function FileUpload({ modelIds, disabled, onComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<BatchProcessingStatus>({
    isProcessing: false,
    currentFileIndex: 0,
    currentFileName: null,
    currentModelIndex: 0,
    currentModelId: null,
    fileProgress: 0,
    totalProgress: 0,
    results: [],
    error: null
  });
  const [showScanner, setShowScanner] = useState(false);
  const [models, setModels] = React.useState<ModelDefinition[]>([]);

  // Pobierz modele przy pierwszym renderowaniu
  React.useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models');
        if (!response.ok) throw new Error('Nie udało się pobrać modeli');
        const data = await response.json();
        setModels(data);
      } catch (err) {
        console.error('Błąd podczas pobierania modeli:', err);
      }
    };

    fetchModels();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    disabled: disabled || status.isProcessing,
    multiple: true,
    noClick: true
  });

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f !== fileToRemove));
  };

  const handleScanComplete = (scannedFiles: File[]) => {
    setFiles(prev => [...prev, ...scannedFiles]);
    setShowScanner(false);
  };

  const startProcessing = async () => {
    if (status.isProcessing || files.length === 0) return;
    
    setStatus(prev => ({ ...prev, isProcessing: true }));

    try {
      const results: ProcessingResult[] = [];
      
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        setStatus(prev => ({
          ...prev,
          currentFileIndex: fileIndex,
          currentFileName: file.name,
          fileProgress: 0
        }));

        for (let modelIndex = 0; modelIndex < modelIds.length; modelIndex++) {
          const modelId = modelIds[modelIndex];
          setStatus(prev => ({
            ...prev,
            currentModelIndex: modelIndex,
            currentModelId: modelId
          }));

          const formData = new FormData();
          formData.append('file', file);
          formData.append('modelId', modelId);

          const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error(`Błąd podczas analizy pliku ${file.name}`);
          }

          const result = await response.json();
          results.push(result);

          // Aktualizuj postęp
          const fileProgress = ((modelIndex + 1) / modelIds.length) * 100;
          const totalProgress = ((fileIndex * modelIds.length + modelIndex + 1) / (files.length * modelIds.length)) * 100;
          
          setStatus(prev => ({
            ...prev,
            fileProgress,
            totalProgress
          }));
        }
      }

      onComplete(results);
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Wystąpił błąd podczas przetwarzania'
      }));
    } finally {
      setStatus(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const stopProcessing = () => {
    setStatus(prev => ({ ...prev, isProcessing: false }));
  };

  if (showScanner) {
    return (
      <DocumentScanner
        selectedModels={models.filter(m => modelIds.includes(m.id))}
        onScanComplete={handleScanComplete}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <>
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b bg-muted/40">
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <div className="flex gap-2">
              <Button 
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = '.pdf,image/*';
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    onDrop(files);
                  };
                  input.click();
                }}
                disabled={disabled || status.isProcessing}
              >
                <Upload className="w-4 h-4 mr-2" />
                Wybierz pliki
              </Button>
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowScanner(true);
                }}
                disabled={disabled || status.isProcessing}
              >
                <Camera className="w-4 h-4 mr-2" />
                Skanuj
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <SelectedFilesList
            files={files}
            onRemoveFile={removeFile}
            disabled={status.isProcessing}
          />

          {files.length > 0 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Wybrano {files.length} {files.length === 1 ? 'plik' : 'plików'}
              </div>
              <Button
                onClick={startProcessing}
                disabled={disabled || files.length === 0 || status.isProcessing}
                className="gap-2"
              >
                {status.isProcessing ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Zatrzymaj
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Rozpocznij
                  </>
                )}
              </Button>
            </div>
          )}

          {status.error && (
            <p className="mt-4 text-sm text-destructive">{status.error}</p>
          )}
        </div>
      </div>
      <ProcessingStatus status={status} onStop={stopProcessing} />
    </>
  );
} 