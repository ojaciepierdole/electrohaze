'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Play, Pause, Camera, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectedFilesList } from '@/components/SelectedFilesList';
import { DocumentScanner } from '@/components/DocumentScanner';
import type { ProcessingResult, BatchProcessingStatus, ModelDefinition } from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  modelIds: string[];
  disabled?: boolean;
  onStart?: () => void;
  onComplete: (results: ProcessingResult[]) => void;
  batchId: string;
  status: BatchProcessingStatus;
  onStatusUpdate: (status: Partial<BatchProcessingStatus>) => void;
}

export function FileUpload({ 
  modelIds, 
  disabled,
  onStart,
  onComplete,
  batchId,
  status,
  onStatusUpdate
}: FileUploadProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const { data: models, isLoading, error } = useDocumentIntelligenceModels();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    onStatusUpdate({
      totalFiles: status.totalFiles + acceptedFiles.length
    });
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
    onStatusUpdate({
      totalFiles: status.totalFiles - 1
    });
  };

  const handleScanComplete = (scannedFiles: File[]) => {
    setFiles(prev => [...prev, ...scannedFiles]);
    setShowScanner(false);
  };

  const handleComplete = (results: ProcessingResult[]) => {
    onStatusUpdate({
      isProcessing: false
    });
    onComplete(results);
  };

  const startProcessing = async () => {
    if (status.isProcessing || files.length === 0) return;
    
    console.log('FileUpload: Rozpoczynam przetwarzanie');
    setIsExpanded(false);
    onStatusUpdate({
      isProcessing: true,
      error: null,
      totalFiles: files.length,
      results: []
    });
    onStart?.();

    try {
      const results: ProcessingResult[] = [];
      
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        const startTime = Date.now();

        console.log(`FileUpload: Przetwarzam plik ${fileIndex + 1}/${files.length}: ${file.name}`);
        onStatusUpdate({
          currentFileIndex: fileIndex,
          currentFileName: file.name,
          fileProgress: 0
        });

        for (let modelIndex = 0; modelIndex < modelIds.length; modelIndex++) {
          const modelId = modelIds[modelIndex];
          console.log(`FileUpload: Używam modelu ${modelIndex + 1}/${modelIds.length}: ${modelId}`);
          onStatusUpdate({
            currentModelIndex: modelIndex,
            currentModelId: modelId
          });

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
          const processingTime = Date.now() - startTime;

          results.push({
            ...result,
            processingTime
          });

          const fileProgress = ((modelIndex + 1) / modelIds.length) * 100;
          const totalProgress = ((fileIndex * modelIds.length + modelIndex + 1) / (files.length * modelIds.length)) * 100;
          
          console.log(`FileUpload: Postęp - plik: ${fileProgress}%, całkowity: ${totalProgress}%`);
          onStatusUpdate({
            fileProgress: fileProgress,
            totalProgress: totalProgress
          });
        }
      }

      console.log('FileUpload: Zakończono przetwarzanie wszystkich plików');
      handleComplete(results);
    } catch (err) {
      console.error('FileUpload: Błąd przetwarzania:', err);
      onStatusUpdate({
        error: err instanceof Error ? err.message : 'Wystąpił błąd podczas przetwarzania',
        isProcessing: false
      });
    }
  };

  const stopProcessing = () => {
    onStatusUpdate({
      isProcessing: false
    });
  };

  if (showScanner) {
    return (
      <DocumentScanner
        selectedModels={models?.filter((m: ModelDefinition) => modelIds.includes(m.id)) ?? []}
        onScanComplete={handleScanComplete}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <Card className="overflow-hidden bg-white shadow-lg">
      <div className="p-4 border-b bg-muted/40">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsExpanded(prev => !prev)}
                className="gap-2"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>Lista plików</span>
              </Button>
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
                    setIsExpanded(true);
                  };
                  input.click();
                }}
                disabled={disabled || status.isProcessing}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Wybierz pliki
              </Button>
              {!status.isProcessing && (
                <Button
                  variant="secondary"
                  onClick={() => setShowScanner(true)}
                  disabled={disabled}
                  className="gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Skanuj
                </Button>
              )}
            </div>
            {files.length > 0 && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Wybrano {files.length} {files.length === 1 ? 'plik' : 'plików'}
                </span>
                <Button
                  onClick={() => {
                    console.log('Kliknięto przycisk', status.isProcessing ? 'Zatrzymaj' : 'Rozpocznij');
                    if (status.isProcessing) {
                      stopProcessing();
                    } else {
                      startProcessing();
                    }
                  }}
                  disabled={disabled || files.length === 0}
                  variant={status.isProcessing ? "destructive" : "default"}
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
          </div>

          {status.isProcessing && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground animate-in fade-in">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>
                  Przetwarzanie pliku {status.currentFileIndex + 1} z {status.totalFiles}
                </span>
              </div>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 ease-in-out"
                  style={{ width: `${status.totalProgress}%` }}
                />
              </div>
              <span className="tabular-nums">
                {Math.round(status.totalProgress)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div {...getRootProps()} className="p-4">
              <input {...getInputProps()} />
              <SelectedFilesList
                files={files}
                onRemoveFile={removeFile}
                disabled={status.isProcessing}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {status.error && (
        <p className="p-4 text-sm text-destructive border-t">{status.error}</p>
      )}
    </Card>
  );
} 