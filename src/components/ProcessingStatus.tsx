'use client';

import * as React from 'react';
import { FileText, Pause, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { truncateFileName } from '@/utils/processing';
import type { BatchProcessingStatus } from '@/types/processing';

interface ProcessingStatusProps {
  status: BatchProcessingStatus;
  onStop: () => void;
}

export function ProcessingStatus({ status, onStop }: ProcessingStatusProps) {
  const {
    isProcessing,
    currentFileIndex,
    currentFileName,
    currentModelIndex,
    currentModelId,
    fileProgress,
    totalProgress,
  } = status;

  if (!isProcessing) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
      <div className="container mx-auto max-w-3xl space-y-4">
        {/* Nagłówek */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="font-medium">
              Przetwarzanie pliku {currentFileIndex + 1} z {status.results.length}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onStop}
            className="gap-2"
          >
            <Pause className="w-4 h-4" />
            Zatrzymaj
          </Button>
        </div>

        {/* Szczegóły aktualnego pliku */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {truncateFileName(currentFileName)}
            </span>
            <span className="font-medium">{fileProgress}%</span>
          </div>
          <Progress value={fileProgress} />
        </div>

        {/* Postęp całkowity */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Całkowity postęp
              {currentModelId && ` (Model: ${currentModelId})`}
            </span>
            <span className="font-medium">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} />
        </div>

        {/* Błędy */}
        {status.error && (
          <div className="flex items-center gap-2 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span>{status.error}</span>
          </div>
        )}
      </div>
    </div>
  );
} 