'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from './ModelSelector';
import { SelectedFilesList } from './SelectedFilesList';
import type { ModelDefinition } from '@/types/processing';

interface BatchProcessingControlsProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  selectedModels: string[];
  onModelSelect: (models: string[]) => void;
  onStart: () => void;
  onStop: () => void;
  isProcessing: boolean;
  models: ModelDefinition[];
  isLoadingModels: boolean;
  modelsError: Error | null;
}

export function BatchProcessingControls({
  files,
  onFilesChange,
  selectedModels,
  onModelSelect,
  onStart,
  onStop,
  isProcessing,
  models,
  isLoadingModels,
  modelsError
}: BatchProcessingControlsProps) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).filter(
      file => file.type === 'application/pdf'
    );
    const updatedFiles = [...files, ...newFiles].slice(0, 20);
    onFilesChange(updatedFiles);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    onFilesChange(files.filter(file => file !== fileToRemove));
  };

  const canStart = files.length > 0 && selectedModels.length > 0 && !isProcessing;
  const canStop = isProcessing;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Pliki PDF</h3>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => document.getElementById('file-input')?.click()}
            disabled={isProcessing}
          >
            Wybierz pliki PDF (max. 20)
          </Button>
          <input
            id="file-input"
            type="file"
            className="hidden"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
          <SelectedFilesList 
            files={files} 
            onRemoveFile={handleRemoveFile}
            disabled={isProcessing}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-2">Modele OCR</h3>
        <ModelSelector
          models={models}
          selectedModels={selectedModels}
          onSelectionChange={onModelSelect}
          isDisabled={isProcessing}
          isLoading={isLoadingModels}
          error={modelsError?.message}
        />
      </div>

      <div className="flex gap-4">
        <Button
          onClick={onStart}
          disabled={!canStart}
          className="flex-1"
        >
          Rozpocznij przetwarzanie
        </Button>
        {canStop && (
          <Button
            variant="destructive"
            onClick={onStop}
          >
            Zatrzymaj
          </Button>
        )}
      </div>
    </div>
  );
} 