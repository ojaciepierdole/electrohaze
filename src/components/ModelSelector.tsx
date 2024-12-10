'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { ModelDefinition } from '@/types/processing';

interface ModelSelectorProps {
  models: ModelDefinition[];
  selectedModels: string[];
  onModelSelect: (models: string[]) => void;
  disabled?: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function ModelSelector({
  models,
  selectedModels,
  onModelSelect,
  disabled,
  isLoading,
  error
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [isFieldsLoading, setIsFieldsLoading] = React.useState(false);

  const filteredModels = React.useMemo(() => {
    if (!search) return models;
    
    const searchLower = search.toLowerCase();
    return models.filter(model => 
      model.name.toLowerCase().includes(searchLower) ||
      model.description.toLowerCase().includes(searchLower) ||
      model.id.toLowerCase().includes(searchLower)
    );
  }, [models, search]);

  const handleSelect = React.useCallback((modelId: string) => {
    if (!modelId) return;

    if (selectedModels.includes(modelId)) {
      onModelSelect(selectedModels.filter(id => id !== modelId));
    } else if (selectedModels.length < 3) {
      onModelSelect([...selectedModels, modelId]);
    }
  }, [selectedModels, onModelSelect]);

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Błąd podczas ładowania modeli: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedModels.map(modelId => {
            const model = models.find(m => m.id === modelId);
            if (!model) return null;
            return (
              <Badge
                key={modelId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {model.id}
                <button
                  onClick={() => handleSelect(modelId)}
                  className="ml-1 hover:text-destructive"
                  disabled={isFieldsLoading}
                >
                  ×
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white"
            disabled={disabled || isLoading || isFieldsLoading || selectedModels.length >= 3}
          >
            {isLoading || isFieldsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isLoading ? "Ładowanie modeli..." : "Sprawdzanie modelu..."}</span>
              </div>
            ) : selectedModels.length === 0 ? (
              "Wybierz modele..."
            ) : (
              `Wybrano ${selectedModels.length} z 3 modeli`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command className="bg-white border rounded-lg shadow-sm">
            <CommandInput 
              placeholder="Szukaj modelu..." 
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
            />
            <CommandEmpty className="p-4 text-sm text-muted-foreground">
              Nie znaleziono modelu
            </CommandEmpty>
            <CommandGroup className="bg-white">
              <ScrollArea className="h-64">
                {filteredModels.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => handleSelect(model.id)}
                    disabled={isFieldsLoading}
                    className="px-4 py-2 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-muted"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedModels.includes(model.id) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{model.id}</span>
                      {model.description && (
                        <span className="text-sm text-muted-foreground">
                          {model.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 