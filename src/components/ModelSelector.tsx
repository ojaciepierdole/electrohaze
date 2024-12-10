'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

  const handleSelect = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onModelSelect(selectedModels.filter(id => id !== modelId));
    } else if (selectedModels.length < 3) {
      onModelSelect([...selectedModels, modelId]);
    }
  };

  return (
    <div className="space-y-2">
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedModels.map(modelId => {
            const model = models.find(m => m.id === modelId);
            return (
              <Badge
                key={modelId}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {model?.name || modelId}
                <button
                  onClick={() => handleSelect(modelId)}
                  className="ml-1 hover:text-destructive"
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
            className="w-full justify-between"
            disabled={disabled || isLoading || selectedModels.length >= 3}
          >
            {isLoading ? (
              "Ładowanie modeli..."
            ) : selectedModels.length === 0 ? (
              "Wybierz modele..."
            ) : (
              `Wybrano ${selectedModels.length} z 3 modeli`
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Szukaj modelu..." />
            <CommandEmpty>Nie znaleziono modelu</CommandEmpty>
            <CommandGroup>
              <ScrollArea className="h-64">
                {models.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => handleSelect(model.id)}
                  >
                    <Check
                      className={`mr-2 h-4 w-4 ${
                        selectedModels.includes(model.id) ? "opacity-100" : "opacity-0"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span>{model.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {model.description}
                      </span>
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