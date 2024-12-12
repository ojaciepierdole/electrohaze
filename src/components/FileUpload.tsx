'use client';

import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Upload } from 'lucide-react';
import { ProcessingResult } from '@/types/processing';

export interface FileUploadProps {
  onUploadStart: () => void;
  onUploadComplete: (results: ProcessingResult[]) => void;
  selectedModels: string[];
  isProcessing: boolean;
  progress: number;
}

export function FileUpload({
  onUploadStart,
  onUploadComplete,
  selectedModels,
  isProcessing,
  progress
}: FileUploadProps) {
  const onDrop = React.useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || selectedModels.length === 0) return;

    onUploadStart();

    const formData = new FormData();
    acceptedFiles.forEach(file => {
      formData.append('files', file);
    });
    selectedModels.forEach(modelId => {
      formData.append('modelId', modelId);
    });

    try {
      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Błąd podczas przetwarzania plików');
      }

      const data = await response.json();
      onUploadComplete(data.results);
    } catch (error) {
      console.error('Błąd:', error);
    }
  }, [onUploadStart, onUploadComplete, selectedModels]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    disabled: isProcessing || selectedModels.length === 0,
    multiple: true
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
            ${isProcessing ? 'cursor-not-allowed opacity-50' : 'hover:border-primary hover:bg-primary/5'}
          `}
        >
          <input {...getInputProps()} />
          
          {isProcessing ? (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" />
              <div>
                <p className="text-sm text-gray-500">Przetwarzanie plików...</p>
                <Progress value={progress} className="mt-2" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-10 h-10 mx-auto text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">
                  {isDragActive
                    ? 'Upuść pliki tutaj...'
                    : selectedModels.length === 0
                    ? 'Najpierw wybierz modele do analizy'
                    : 'Przeciągnij i upuść pliki lub kliknij, aby wybrać'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Obsługiwane formaty: PDF, JPG, PNG
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 