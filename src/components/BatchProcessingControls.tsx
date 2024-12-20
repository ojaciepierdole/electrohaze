'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileList } from '@/components/FileList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BatchProcessingControlsProps {
  onFilesChange: (files: File[]) => void;
  isProcessing: boolean;
}

export function BatchProcessingControls({
  onFilesChange,
  isProcessing
}: BatchProcessingControlsProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => {
      const newFiles = [...prev, ...acceptedFiles];
      onFilesChange(newFiles);
      return newFiles;
    });
  }, [onFilesChange]);

  const removeFile = useCallback((file: File) => {
    setFiles(prev => {
      const newFiles = prev.filter(f => f !== file);
      onFilesChange(newFiles);
      return newFiles;
    });
  }, [onFilesChange]);

  const removeAllFiles = useCallback(() => {
    setFiles([]);
    onFilesChange([]);
  }, [onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    }
  });

  return (
    <div className="space-y-4">
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

      <FileList 
        files={files}
        onRemove={removeFile}
        onRemoveAll={removeAllFiles}
        isProcessing={isProcessing}
      />
    </div>
  );
} 