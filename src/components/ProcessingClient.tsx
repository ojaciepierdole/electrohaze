'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { FileList } from '@/components/FileList';
import { ModelSelector } from '@/components/ModelSelector';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { useProcessingStore } from '@/stores/processing-store';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Upload, Trash2 } from 'lucide-react';

export function ProcessingClient() {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const { isProcessing, processDocuments } = useDocumentProcessing();
  const { data: models = [], isLoading: isLoadingModels } = useDocumentIntelligenceModels();
  const { toast } = useToast();

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    setSelectedFiles(Array.from(files));
  };

  const handleFileRemove = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
  };

  const handleProcessing = async () => {
    if (!selectedFiles.length || !selectedModels.length) {
      toast({
        title: "Błąd",
        description: "Wybierz pliki i modele do analizy",
        variant: "destructive",
      });
      return;
    }

    try {
      await processDocuments(selectedFiles, selectedModels);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Błąd przetwarzania:', error);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex flex-col items-start gap-2">
        <h1 className="text-2xl font-semibold">Analiza dokumentów PDF</h1>
        <p className="text-sm text-gray-500">
          Przetwarzaj dokumenty PDF używając modeli OCR Azure Document Intelligence
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Lewa kolumna - wybór modeli */}
        <div>
          <ModelSelector
            models={models}
            selectedModels={selectedModels}
            onSelectionChange={setSelectedModels}
            isLoading={isLoadingModels}
          />
        </div>

        {/* Prawa kolumna - wybór plików */}
        <div className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  variant="outline"
                  asChild
                  className="flex-1"
                  disabled={isProcessing}
                >
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Wybierz pliki
                  </label>
                </Button>
                {selectedFiles.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={handleClearFiles}
                    disabled={isProcessing}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Usuń wszystkie
                  </Button>
                )}
              </div>

              <FileList
                files={selectedFiles}
                onRemove={handleFileRemove}
                maxHeight="calc(3 * (4rem + 0.75rem) - 0.75rem)" // 3 modele * (wysokość modelu + gap) - gap
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Przycisk przetwarzania */}
      {(selectedFiles.length > 0 && selectedModels.length > 0) && (
        <Button
          onClick={handleProcessing}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? 'Przetwarzanie...' : 'Rozpocznij analizę'}
        </Button>
      )}
    </div>
  );
} 