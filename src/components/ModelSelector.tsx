'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Check, AlertCircle } from 'lucide-react';
import { ModelDefinition } from '@/types/processing';
import { cn } from '@/lib/utils';
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

export interface ModelSelectorProps {
  models: ModelDefinition[];
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  isLoading: boolean;
  error?: string;
}

export function ModelSelector({
  models,
  selectedModels,
  onSelectionChange,
  isLoading,
  error
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleModelSelect = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter(id => id !== modelId));
    } else if (selectedModels.length < 3) {
      onSelectionChange([...selectedModels, modelId]);
    }
    // Zamykamy popover po wyborze modelu
    setOpen(false);
  };

  const handleModelRemove = (modelId: string) => {
    onSelectionChange(selectedModels.filter(id => id !== modelId));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4 border-gray-900/10">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-4 border-gray-900/10">
          <div className="text-sm text-red-500">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedModels.length === 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex gap-2 items-center text-amber-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              Wybierz przynajmniej jeden model do analizy dokumentów
            </p>
          </div>
        </Card>
      )}

      {/* Popover z listą modeli */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between border-gray-900/10 hover:border-gray-900/20 hover:bg-gray-50"
          >
            <span>
              {selectedModels.length === 0
                ? "Wyszukaj model"
                : `${selectedModels.length} ${
                    selectedModels.length === 1 ? "model" : "modele"
                  } wybrane`}
            </span>
            <span className="text-xs text-muted-foreground ml-2">
              {selectedModels.length}/3
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Wyszukaj model..." />
            <CommandEmpty>Nie znaleziono modeli</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {models.map((model) => {
                const isSelected = selectedModels.includes(model.id);
                return (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => handleModelSelect(model.id)}
                    className="flex items-start justify-between py-2 px-4"
                  >
                    <div className="flex-1 mr-2">
                      <div className="font-medium text-sm">{model.id}</div>
                      {model.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {model.description}
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border",
                      isSelected ? "bg-primary border-primary" : "border-gray-300"
                    )}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Wybrane modele */}
      {selectedModels.length > 0 && (
        <Card className="p-4 border-gray-900/10">
          <div className="flex flex-col gap-2">
            {selectedModels.map((modelId) => {
              const model = models.find(m => m.id === modelId);
              if (!model) return null;
              
              return (
                <Card
                  key={modelId}
                  className={cn(
                    "p-3 bg-gray-50 border border-gray-900/10",
                    "hover:bg-gray-100 hover:shadow-md hover:border-gray-900/20 transition-all group"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{model.id}</div>
                      {model.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{model.description}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleModelRemove(modelId)}
                      className={cn(
                        "h-8 w-8 p-0 rounded-full",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        "hover:bg-red-100 hover:text-red-600"
                      )}
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Usuń model</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
} 