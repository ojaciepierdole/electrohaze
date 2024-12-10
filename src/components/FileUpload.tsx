'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Play, Pause, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectedFilesList } from '@/components/SelectedFilesList';
import { DocumentScanner } from '@/components/DocumentScanner';
import type { ProcessingResult, BatchProcessingStatus, ModelDefinition } from '@/types/processing';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  modelIds: string[];
  disabled?: boolean;
  onStart?: () => void;
  onComplete: (results: ProcessingResult[]) => void;
  batchId: string;
}

export function FileUpload({ 
  modelIds, 
  disabled,
  onStart,
  onComplete,
  batchId 
}: FileUploadProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<BatchProcessingStatus>({
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
  const [showScanner, setShowScanner] = useState(false);
  const { data: models, isLoading, error } = useDocumentIntelligenceModels();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    setStatus(prev => ({ ...prev, totalFiles: prev.totalFiles + acceptedFiles.length }));
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
    setStatus(prev => ({ ...prev, totalFiles: prev.totalFiles - 1 }));
  };

  const handleScanComplete = (scannedFiles: File[]) => {
    setFiles(prev => [...prev, ...scannedFiles]);
    setShowScanner(false);
  };

  const startProcessing = async () => {
    if (status.isProcessing || files.length === 0) return;
    
    setIsExpanded(false);
    setStatus(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null,
      totalFiles: files.length
    }));
    onStart?.();

    try {
      const results: ProcessingResult[] = [];
      
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        const startTime = Date.now();

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
          const processingTime = Date.now() - startTime;

          results.push({
            ...result,
            processingTime
          });

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
        selectedModels={models?.filter((m: ModelDefinition) => modelIds.includes(m.id)) ?? []}
        onScanComplete={handleScanComplete}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsExpanded(prev => !prev)}
                className="gap-2"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
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

      <ProcessingStatus status={status} onStop={stopProcessing} />
    </>
  );
} 