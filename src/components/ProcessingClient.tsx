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
import { AnimatePresence, motion } from 'framer-motion';
import type { DocumentSections } from '@/utils/data-processing/completeness/confidence';
import { TimingStats } from '@/types/timing';
import { AnalysisSummary } from '@/components/AnalysisSummary';
import { convertToDocumentSections } from '@/utils/data-conversion';
import { calculateDocumentCompleteness } from '@/utils/data-processing/completeness/confidence';
import { isDocumentComplete } from '@/utils/document-validation';

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
  const [sections, setSections] = React.useState<DocumentSections>({});
  const [processingTimes, setProcessingTimes] = React.useState<TimingStats>({
    uploadTime: 0,
    ocrTime: 0,
    analysisTime: 0,
    totalTime: 0,
    averageTimePerDocument: 0,
    documentsProcessed: 0,
    parallelProcessing: false
  });
  const [documentCount, setDocumentCount] = React.useState(0);
  const [validDocumentsCount, setValidDocumentsCount] = React.useState(0);

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
    if (!isProcessing && processingStatus.results?.length > 0) {
      setSelectedFiles([]);
      setIsParametersExpanded(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isProcessing, processingStatus.results]);

  // Sprawdź, czy analiza jest zakończona
  const isAnalysisComplete = !isProcessing && processingStatus.results?.length > 0;

  // Aktualizacja czasów podczas przetwarzania
  React.useEffect(() => {
    if (processingStatus.results.length > 0) {
      const endTime = Date.now();
      const startTime = processingStartTime || endTime;
      
      // Oblicz czasy przetwarzania
      const times = processingStatus.results.reduce((acc, doc) => {
        const timing = doc.timing || { uploadTime: 0, ocrTime: 0, analysisTime: 0, totalTime: 0 };
        return {
          uploadTime: acc.uploadTime + timing.uploadTime,
          ocrTime: acc.ocrTime + timing.ocrTime,
          analysisTime: acc.analysisTime + timing.analysisTime,
          totalTime: acc.totalTime + timing.totalTime
        };
      }, {
        uploadTime: 0,
        ocrTime: 0,
        analysisTime: 0,
        totalTime: 0
      });
      
      // Aktualizacja czasów z rzeczywistymi wartościami
      setProcessingTimes({
        uploadTime: times.uploadTime,
        ocrTime: times.ocrTime,
        analysisTime: times.analysisTime,
        totalTime: endTime - startTime,
        averageTimePerDocument: (endTime - startTime) / processingStatus.results.length,
        documentsProcessed: processingStatus.results.length,
        parallelProcessing: true
      });
      
      // Aktualizacja sekcji z konwersją typów
      const lastResult = processingStatus.results[processingStatus.results.length - 1];
      if (lastResult) {
        setSections(convertToDocumentSections(lastResult.mappedData));
      }
      
      // Aktualizacja liczników
      setDocumentCount(processingStatus.results.length);
      
      // Liczymy dokumenty z zieloną flagą (przydatne do podpisania umowy)
      const validDocs = processingStatus.results.filter(result => result.usability === true).length;
      setValidDocumentsCount(validDocs);
    }
  }, [processingStatus.results, processingStartTime]);

  return (
    <div className="space-y-4">
      {/* Wyświetlamy statystyki tylko jeśli mamy wyniki i nie trwa przetwarzanie */}
      {!isProcessing && processingStatus.results.length > 0 && (
        <AnalysisSummary
          sections={sections}
          processingTimes={processingTimes}
          documentCount={documentCount}
          validDocuments={validDocumentsCount}
        />
      )}

      <Card>
        {/* Nagłówek z przyciskiem zwijania/rozwijania */}
        <div 
          className={cn(
            "p-4 border-b cursor-pointer transition-colors",
            isParametersExpanded ? "bg-gray-50" : "hover:bg-gray-50"
          )}
          onClick={() => setIsParametersExpanded(!isParametersExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">Parametry analizy</h2>
              {processingStatus.results?.length > 0 && (
                <span className="text-sm text-gray-500">
                  ({processingStatus.results.length} {processingStatus.results.length === 1 ? 'plik' : 'plików'})
                </span>
              )}
            </div>
            <button 
              className={cn(
                "text-gray-500 hover:text-gray-700",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setIsParametersExpanded(!isParametersExpanded);
              }}
              disabled={isProcessing}
            >
              {isParametersExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Zawartość karty */}
        {(isProcessing || processingStatus.results?.length > 0) ? (
          <div className={cn("overflow-hidden transition-all duration-200", 
            isParametersExpanded ? "max-h-[500px]" : "max-h-0"
          )}>
            <div className="p-4">
              <ProcessingProgress
                isProcessing={isProcessing}
                currentFileIndex={processingStatus.currentFileIndex || 0}
                totalFiles={processingStatus.totalFiles || 0}
                results={processingStatus.results}
                error={processingStatus.error?.toString() || null}
                onReset={handleReset}
              />
            </div>
          </div>
        ) : (
          <div className={cn("overflow-hidden transition-all duration-200",
            isParametersExpanded ? "max-h-[500px]" : "max-h-0"
          )}>
            <div className="p-4">
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
          </div>
        )}
      </Card>

      {/* Wyniki przetwarzania */}
      <AnimatePresence mode="wait">
        {processingStatus.results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <BatchProcessingResults
              results={processingStatus.results}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 