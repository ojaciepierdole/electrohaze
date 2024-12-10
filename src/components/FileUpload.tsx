'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Play, Pause, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SelectedFilesList } from '@/components/SelectedFilesList';
import { DocumentScanner } from '@/components/DocumentScanner';
import type { ProcessingResult } from '@/types/processing';

interface FileUploadProps {
  modelIds: string[];
  disabled?: boolean;
  onComplete: (results: ProcessingResult[]) => void;
}

export function FileUpload({ modelIds, disabled, onComplete }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    disabled: disabled || isProcessing,
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
    if (isProcessing || files.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Implementacja przetwarzania
      const results: ProcessingResult[] = [];
      onComplete(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd podczas przetwarzania');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showScanner) {
    return (
      <DocumentScanner
        onScanComplete={handleScanComplete}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
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
              disabled={disabled || isProcessing}
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
              disabled={disabled || isProcessing}
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
          disabled={isProcessing}
        />

        {files.length > 0 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Wybrano {files.length} {files.length === 1 ? 'plik' : 'plików'}
            </div>
            <Button
              onClick={startProcessing}
              disabled={disabled || files.length === 0 || isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
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

        {error && (
          <p className="mt-4 text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
} 