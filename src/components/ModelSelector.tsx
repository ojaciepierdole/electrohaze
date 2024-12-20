'use client';

import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
import type { ModelDefinition } from '@/types/processing';

export interface ModelSelectorProps {
  models: ModelDefinition[];
  selectedModels: string[];
  onSelect: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ models, selectedModels, onSelect, disabled }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = React.useCallback((modelId: string) => {
    onSelect(modelId);
    setOpen(false);
  }, [onSelect]);

  const selectedModel = selectedModels.length > 0 
    ? models.find(m => m.id === selectedModels[0])
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedModel ? (
            <div className="flex items-center gap-2 text-left">
              <span className="flex-1">{selectedModel.name}</span>
              <Badge variant="secondary" className="ml-2">
                Custom
              </Badge>
            </div>
          ) : (
            <span>Wybierz model...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Szukaj modeli..." />
          <CommandEmpty>Nie znaleziono modeli.</CommandEmpty>
          <CommandGroup>
            {models.map((model) => (
              <CommandItem
                key={model.id}
                value={model.id}
                onSelect={() => handleSelect(model.id)}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedModels[0] === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ID: {model.id}
                    </span>
                    {model.description && (
                      <span className="text-xs text-muted-foreground">
                        {model.description}
                      </span>
                    )}
                  </div>
                </div>
                {model.isCustom && (
                  <Badge variant="secondary" className="ml-4">
                    Custom
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 