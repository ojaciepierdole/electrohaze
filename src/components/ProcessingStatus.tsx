'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { CircularProgress } from '@/components/ui/circular-progress';
import { Loader2 } from 'lucide-react';

interface ProcessingStatusProps {
  currentFileIndex: number;
  totalFiles: number;
  currentFileName: string;
  currentModelIndex: number;
  totalModels: number;
  currentModelId: string;
  fileProgress: number;
  totalProgress: number;
}

export function ProcessingStatus({
  currentFileIndex,
  totalFiles,
  currentFileName,
  currentModelIndex,
  totalModels,
  currentModelId,
  fileProgress,
  totalProgress
}: ProcessingStatusProps) {
  return (
    <Card className="bg-white shadow-sm">
      <div className="p-6">
        <div className="flex items-center gap-4">
          <CircularProgress value={totalProgress} size={48} className="text-blue-500" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm font-medium">
                Przetwarzanie pliku {currentFileIndex + 1} z {totalFiles}
              </span>
            </div>
            <div className="text-sm text-gray-500 truncate">
              {currentFileName}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Model {currentModelIndex + 1} z {totalModels}: {currentModelId}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-blue-500">
              {Math.round(totalProgress)}%
            </div>
            <div className="text-sm text-gray-500">
              ukończono
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
} 