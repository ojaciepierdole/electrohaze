'use client';

import React, { useState, useEffect } from 'react';
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
import type { Model } from '@/types/models';

interface ModelSelectorProps {
  onSelectionChange: (modelId: string) => void;
  selectedModel: string | null;
  models: Model[];
  isLoading?: boolean;
  disabled?: boolean;
}

export function ModelSelector({
  onSelectionChange,
  selectedModel,
  models,
  isLoading = false,
  disabled = false
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedModelId = selectedModel || '';

  const selectModel = (modelId: string) => {
    onSelectionChange(modelId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {!mounted ? (
            <span>Ładowanie modeli...</span>
          ) : selectedModel ? (
            <span className="flex-1 truncate text-left">
              {selectedModel}
            </span>
          ) : (
            <span>{isLoading ? 'Ładowanie modeli...' : 'Wybierz model...'}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command className="max-h-[300px]">
          <CommandInput placeholder="Szukaj modeli..." />
          <CommandEmpty>Nie znaleziono modeli.</CommandEmpty>
          <CommandGroup className="max-h-[250px] overflow-y-auto">
            {models.map((model) => (
              <CommandItem
                key={model.id}
                value={model.id}
                onSelect={() => selectModel(model.id)}
                className="flex flex-col items-start py-2 px-3"
              >
                <div className="flex items-center w-full">
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedModelId === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{model.id}</span>
                      {model.isCustom && (
                        <Badge variant="secondary" className="ml-2">
                          Custom
                        </Badge>
                      )}
                    </div>
                    {model.description && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {model.description}
                      </span>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 