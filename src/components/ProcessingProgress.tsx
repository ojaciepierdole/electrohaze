'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProcessingProgressProps {
  currentFile?: string;
  currentFileIndex?: number;
  totalFiles?: number;
  fileProgress?: number;
  totalProgress?: number;
  isProcessing: boolean;
}

export function ProcessingProgress({
  currentFile,
  currentFileIndex,
  totalFiles,
  fileProgress = 0,
  totalProgress = 0,
  isProcessing
}: ProcessingProgressProps) {
  if (!isProcessing) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Przetwarzanie pliku {currentFileIndex} z {totalFiles}
          </span>
          <span className="font-medium">{currentFile}</span>
        </div>
        <Progress value={fileProgress} className="h-2" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Całkowity postęp</span>
          <span className="font-medium">{totalProgress}%</span>
        </div>
        <Progress value={totalProgress} className="h-2" />
      </div>
    </div>
  );
} 