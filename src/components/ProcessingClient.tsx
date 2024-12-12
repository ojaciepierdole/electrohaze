'use client';

import * as React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Upload, X } from 'lucide-react';
import type { 
  ModelDefinition, 
  ProcessingResult, 
  BatchProcessingStatus
} from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ProcessingClient() {
  const [selectedModels, setSelectedModels] = React.useState<string[]>([]);
  const [files, setFiles] = React.useState<File[]>([]);
  const [isFileListOpen, setIsFileListOpen] = React.useState(false);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = React.useState(false);
  const [processingStatus, setProcessingStatus] = React.useState<BatchProcessingStatus>({
    isProcessing: false,
    currentFileIndex: 0,
    currentFileName: null,
    currentModelIndex: 0,
    currentModelId: null,
    fileProgress: 0,
    totalProgress: 0,
    totalFiles: 0,
    results: [],
    error: null
  });
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: models = [], isLoading: isLoadingModels, error: modelsError } = useDocumentIntelligenceModels();
  const { isProcessing, progress, processDocuments } = useDocumentProcessing();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles = Array.from(selectedFiles).filter(
      file => file.type === 'application/pdf'
    );
    const updatedFiles = [...files, ...newFiles].slice(0, 20);
    setFiles(updatedFiles);
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  const handleModelSelect = (modelId: string) => {
    setSelectedModels(current => {
      if (current.includes(modelId)) {
        return current.filter(id => id !== modelId);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, modelId];
    });
    setIsModelSelectorOpen(false);
  };

  const handleStartProcessing = async () => {
    if (files.length === 0 || selectedModels.length === 0 || isProcessing) return;

    try {
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: true,
        totalFiles: files.length,
        currentFileIndex: 0,
        currentFileName: files[0].name,
        totalProgress: 0
      }));

      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });
      selectedModels.forEach(modelId => {
        formData.append('modelId', modelId);
      });

      const response = await fetch('/api/analyze/batch', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Błąd podczas przetwarzania plików');
      }

      const data = await response.json();
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        results: data.results
      }));
    } catch (error) {
      setProcessingStatus(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Nieznany błąd'
      }));
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Nagłówek sekcji */}
            <h2 className="text-xl font-semibold">Przygotowanie analizy</h2>

            {/* Wybór modeli */}
            <div className="flex items-center gap-2">
              <Popover open={isModelSelectorOpen} onOpenChange={setIsModelSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    disabled={isLoadingModels || isProcessing}
                  >
                    <span>
                      {selectedModels.length > 0
                        ? `Wybrano ${selectedModels.length} z 3 modeli`
                        : 'Wybierz modele do analizy'}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Szukaj modelu..." />
                    <CommandEmpty>Nie znaleziono modeli.</CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-y-auto">
                      {models.map((model) => (
                        <CommandItem
                          key={model.id}
                          value={model.id}
                          onSelect={() => handleModelSelect(model.id)}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{model.id}</span>
                            <span className="text-xs text-muted-foreground">{model.description}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Wybrane modele */}
            {selectedModels.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedModels.map((modelId) => {
                  const model = models.find(m => m.id === modelId);
                  return (
                    <Badge
                      key={modelId}
                      variant="secondary"
                      className="pl-2 pr-1 py-1 flex items-center gap-1"
                    >
                      {model?.name || modelId}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedModels(selectedModels.filter(id => id !== modelId))}
                        disabled={isProcessing}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Kontrolki plików */}
            <div className="flex items-center gap-2">
              <Collapsible
                open={isFileListOpen}
                onOpenChange={setIsFileListOpen}
                className="w-full"
              >
                <div className="flex items-center gap-2">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={isProcessing}>
                      <span>Lista plików</span>
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform duration-200 ml-2",
                        isFileListOpen ? "rotate-180" : ""
                      )} />
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Wybierz pliki
                  </Button>
                </div>

                <CollapsibleContent className="mt-2">
                  <div className="rounded-md border p-4">
                    {files.length === 0 ? (
                      <div className="text-center text-sm text-gray-500">
                        Brak wybranych plików
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {files.map((file, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <span className="text-sm">{file.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(file)}
                              disabled={isProcessing}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Pasek postępu */}
            {processingStatus.isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-500">
                  <span>
                    Plik {processingStatus.currentFileIndex + 1} z {processingStatus.totalFiles}
                  </span>
                  <span>{processingStatus.currentFileName}</span>
                </div>
                <Progress value={processingStatus.totalProgress} />
              </div>
            )}

            {/* Licznik plików i przycisk rozpoczęcia */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {files.length > 0 ? `Wybrano ${files.length} ${files.length === 1 ? 'plik' : 'pliki'}` : ''}
              </div>
              <Button
                onClick={handleStartProcessing}
                disabled={files.length === 0 || selectedModels.length === 0 || isProcessing}
              >
                {isProcessing ? 'Przetwarzanie...' : 'Rozpocznij'}
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>
    </div>
  );
} 