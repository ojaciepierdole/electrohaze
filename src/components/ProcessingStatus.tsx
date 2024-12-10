'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { BatchProcessingStatus } from '@/types/processing';

interface ProcessingStatusProps {
  status: BatchProcessingStatus;
  onStop?: () => void;
}

export function ProcessingStatus({ status, onStop }: ProcessingStatusProps) {
  if (!status.isProcessing) return null;

  const currentFile = status.currentFileIndex + 1;
  const totalFiles = status.results.length + (status.currentFileName ? 1 : 0);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <div className="flex-1">
          {status.currentFileName ? (
            <>
              <div>Przetwarzanie pliku {currentFile} z {totalFiles}</div>
              <div className="text-muted-foreground">{status.currentFileName}</div>
            </>
          ) : (
            <div>Przygotowywanie...</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={status.fileProgress} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Postęp pliku</span>
          <span>{Math.round(status.fileProgress)}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <Progress value={status.totalProgress} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Całkowity postęp</span>
          <span>{Math.round(status.totalProgress)}%</span>
        </div>
      </div>
    </Card>
  );
} 