'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { FileList } from '@/components/FileList';
import { ModelSelector } from '@/components/ModelSelector';
import { ProcessingProgress } from '@/components/ProcessingProgress';
import { BatchProcessingResults } from '@/components/BatchProcessingResults';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { useProcessingStore } from '@/stores/processing-store';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProcessingClient() {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [isParametersExpanded, setIsParametersExpanded] = React.useState(true);
  const [processingStartTime, setProcessingStartTime] = React.useState<number | null>(null);
  const { isProcessing, processDocuments } = useDocumentProcessing();
  const { data: models = [], isLoading: isLoadingModels } = useDocumentIntelligenceModels();
  const processingStatus = useProcessingStore();
  const { addToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;

    // Konwertuj FileList na Array i sprawdź duplikaty
    const newFiles = Array.from(files);
    const existingFileNames = new Set(selectedFiles.map(f => f.name));
    
    // Filtruj duplikaty i dodaj tylko nowe pliki
    const uniqueNewFiles = newFiles.filter(file => !existingFileNames.has(file.name));
    
    if (uniqueNewFiles.length === 0) {
      addToast(
        'warning',
        'Uwaga',
        'Wybrane pliki zostały już dodane'
      );
      return;
    }

    // Dodaj nowe pliki do istniejącej listy
    setSelectedFiles(prev => [...prev, ...uniqueNewFiles]);

    // Wyczyść wartość inputa, aby można było wybrać ten sam plik ponownie
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileRemove = (file: File) => {
    setSelectedFiles(prev => prev.filter(f => f !== file));
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessing = async () => {
    if (!selectedFiles.length || !selectedModels.length) {
      addToast(
        'warning',
        'Błąd',
        'Wybierz pliki i modele do analizy'
      );
      return;
    }

    setIsParametersExpanded(false);
    setProcessingStartTime(Date.now());

    try {
      await processDocuments(selectedFiles, selectedModels);
    } catch (error) {
      console.error('Błąd przetwarzania:', error);
      addToast(
        'error',
        'Błąd',
        'Wystąpił błąd podczas przetwarzania dokumentów'
      );
    }
  };

  const handleReset = () => {
    processingStatus.reset();
    setSelectedFiles([]);
    setIsParametersExpanded(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Efekt czyszczący pliki po zakończeniu przetwarzania
  React.useEffect(() => {
    if (!isProcessing && processingStatus.results.length > 0) {
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isProcessing, processingStatus.results.length]);

  // Oblicz średnią pewność dla wszystkich dokumentów
  const averageConfidence = processingStatus.results.length > 0
    ? processingStatus.results.reduce((sum, result) => sum + result.confidence, 0) / processingStatus.results.length
    : 0;

  // Oblicz całkowity czas przetwarzania
  const totalProcessingTime = processingStartTime && !isProcessing
    ? Date.now() - processingStartTime
    : processingStatus.results.reduce((sum, result) => sum + result.processingTime, 0);

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      {/* Sekcja parametrów */}
      <Card className={cn(
        "border-gray-900/10",
        isProcessing ? "processing-progress collapsed" : ""
      )}>
        {isProcessing ? (
          <ProcessingProgress
            {...processingStatus}
            onExpand={() => setIsParametersExpanded(true)}
            onCollapse={() => setIsParametersExpanded(false)}
            onReset={handleReset}
          />
        ) : (
          <div className="p-4 space-y-4">
            <button
              onClick={() => setIsParametersExpanded(!isParametersExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-lg font-semibold">Parametry analizy</h2>
              {isParametersExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {isParametersExpanded && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  {/* Lewa kolumna - wybór modeli */}
                  <div>
                    <ModelSelector
                      models={models}
                      selectedModels={selectedModels}
                      onSelectionChange={setSelectedModels}
                      isLoading={isLoadingModels}
                      isDisabled={isProcessing}
                    />
                  </div>

                  {/* Prawa kolumna - wybór plików */}
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                          <input
                            ref={fileInputRef}
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
                          maxHeight="calc(3 * (4rem + 0.75rem) - 0.75rem)"
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
                    className="w-full mt-4"
                    size="lg"
                  >
                    {isProcessing ? 'Przetwarzanie...' : 'Rozpocznij analizę'}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Wyniki przetwarzania */}
      {processingStatus.results.length > 0 && !isProcessing && (
        <>
          <BatchProcessingResults
            results={processingStatus.results}
          />
        </>
      )}
    </div>
  );
} 