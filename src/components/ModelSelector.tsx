'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
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
  models = [],
  selectedModels,
  onModelSelect,
  disabled,
  isLoading,
  error
}: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filteredModels = models.filter(model => 
    model.id.toLowerCase().includes(search.toLowerCase()) ||
    (model.description && model.description.toLowerCase().includes(search.toLowerCase()))
  );

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
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-white"
            disabled={disabled || isLoading || selectedModels.length >= 3}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Ładowanie modeli...</span>
              </div>
            ) : selectedModels.length === 0 ? (
              "Wybierz modele..."
            ) : (
              `Wybrano ${selectedModels.length} z 3 modeli`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command 
            className="bg-white border rounded-lg shadow-sm"
            shouldFilter={false}
          >
            <CommandInput 
              placeholder="Szukaj modelu..." 
              value={search}
              onValueChange={setSearch}
              className="border-0 focus:ring-0"
              autoFocus
            />
            <CommandEmpty className="p-4 text-sm text-muted-foreground">
              Nie znaleziono modelu
            </CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-[200px]">
                <div className="p-1">
                  {filteredModels.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleSelect(model.id)}
                      className="flex items-center cursor-pointer rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedModels.includes(model.id) ? "opacity-100" : "opacity-0"
                        }`}
                      />
                      <div className="flex flex-col">
                        <span className="text-base font-semibold">{model.id}</span>
                        {model.description && (
                          <span className="text-sm text-muted-foreground">
                            {model.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </div>
              </ScrollArea>
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedModels.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {selectedModels.map(modelId => {
            const model = models.find(m => m.id === modelId);
            if (!model) return null;
            return (
              <div
                key={modelId}
                className="relative flex flex-col p-3 bg-white rounded-lg border shadow-sm"
              >
                <button
                  onClick={() => handleSelect(modelId)}
                  className="absolute top-1.5 right-1.5 p-1 hover:bg-muted/50 rounded-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="sr-only">Usuń model</span>
                </button>
                <div className="font-medium text-sm">{model.id}</div>
                {model.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {model.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 