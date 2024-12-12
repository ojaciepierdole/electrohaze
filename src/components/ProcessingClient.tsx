'use client';

import * as React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Upload, Trash2 } from 'lucide-react';
import type { ModelDefinition, ProcessingResult } from '@/types/processing';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
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
  const [selectedModels, setSelectedModels] = React.useState<ModelDefinition[]>([]);
  const [files, setFiles] = React.useState<File[]>([]);
  const [isModelSelectorOpen, setIsModelSelectorOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { data: models = [], isLoading: isLoadingModels } = useDocumentIntelligenceModels();
  const { 
    isProcessing, 
    progress, 
    processDocuments, 
    pauseProcessing, 
    resumeProcessing, 
    cancelProcessing,
    isPaused 
  } = useDocumentProcessing();

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

  const handleClearFiles = () => {
    setFiles([]);
  };

  const handleModelSelect = (model: ModelDefinition) => {
    setSelectedModels(current => {
      if (current.find(m => m.id === model.id)) {
        return current.filter(m => m.id !== model.id);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, model];
    });
    setIsModelSelectorOpen(false);
  };

  const handleStartProcessing = async () => {
    if (files.length === 0 || selectedModels.length === 0 || isProcessing) return;
    await processDocuments(files, selectedModels.map(m => m.id));
  };

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Modele OCR</h2>
          <Popover open={isModelSelectorOpen} onOpenChange={setIsModelSelectorOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-start">
                Wybierz model
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Szukaj modelu..." />
                <CommandEmpty>Nie znaleziono modeli.</CommandEmpty>
                <CommandGroup className="max-h-[200px] overflow-y-auto">
                  {models.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleModelSelect(model)}
                    >
                      {model.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected Models */}
        <div className="flex flex-wrap gap-3">
          {selectedModels.map((model) => (
            <Card
              key={model.id}
              className={cn(
                "p-4 transition-all duration-200 cursor-pointer group",
                isProcessing 
                  ? "opacity-50 cursor-not-allowed" 
                  : "hover:shadow-md"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{model.name}</h3>
                  <p className="text-sm text-muted-foreground">{model.description}</p>
                </div>
                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleModelSelect(model)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pliki PDF</h2>
          <div className="flex items-center gap-2">
            {files.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFiles}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Usuń wszystkie
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Wybierz pliki
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
          disabled={isProcessing}
        />

        {files.length > 0 && (
          <Card className="p-4">
            <ul className="space-y-2">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between">
                  <span className="text-sm truncate">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file)}
                    disabled={isProcessing}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Processing Controls */}
      <div className="flex justify-end gap-3">
        {isProcessing && (
          <Button
            variant="destructive"
            onClick={cancelProcessing}
            className="min-w-[100px]"
          >
            Anuluj
          </Button>
        )}
        <Button
          variant={isProcessing ? "secondary" : "default"}
          className={cn(
            "min-w-[120px]",
            !isProcessing && "bg-green-600 hover:bg-green-700",
            isProcessing && isPaused && "bg-green-600 hover:bg-green-700",
            isProcessing && !isPaused && "bg-red-600 hover:bg-red-700"
          )}
          onClick={
            !isProcessing ? handleStartProcessing :
            isPaused ? resumeProcessing :
            pauseProcessing
          }
          disabled={files.length === 0 || selectedModels.length === 0}
        >
          {!isProcessing ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Rozpocznij
            </>
          ) : isPaused ? (
            <>
              <Play className="h-4 w-4 mr-2" />
              Wznów
            </>
          ) : (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Pauza
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 