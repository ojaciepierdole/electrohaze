'use client';

import React from 'react';
import { FileList } from '@/components/FileList';
import { DocumentList } from '@/components/DocumentList';
import { ModelSelector } from '@/components/ModelSelector';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { ProcessingResult } from '@/types/processing';
import type { ModelDefinition } from '@/types/processing';

interface BatchProcessingControlsProps {
  files: File[];
  onRemoveFile: (file: File) => void;
  onStartProcessing: (selectedModels: string[]) => void;
  isProcessing: boolean;
  currentFileIndex?: number;
  totalFiles?: number;
  error: string | null;
  results: ProcessingResult[];
  models: ModelDefinition[];
  selectedModels: string[];
  onModelSelect: (modelId: string) => void;
}

export function BatchProcessingControls({
  files,
  onRemoveFile,
  onStartProcessing,
  isProcessing,
  currentFileIndex,
  totalFiles,
  error,
  results,
  models,
  selectedModels,
  onModelSelect
}: BatchProcessingControlsProps) {
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <FileList 
          files={files}
          isProcessing={isProcessing}
        />

        <ModelSelector
          models={models}
          selectedModels={selectedModels}
          onSelect={onModelSelect}
          disabled={isProcessing}
        />

        <Button
          onClick={() => onStartProcessing(selectedModels)}
          disabled={files.length === 0 || selectedModels.length === 0 || isProcessing}
          className="w-full"
        >
          {isProcessing ? 'Przetwarzanie...' : 'Rozpocznij przetwarzanie'}
        </Button>
      </div>

      {results.length > 0 && (
        <DocumentList
          documents={results}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
} 