'use client';

import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { DocumentIntelligenceModel } from '@/types/documentIntelligence';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';

interface ModelSelectorProps {
  onModelSelect: (model: DocumentIntelligenceModel) => void;
}

export function ModelSelector({ onModelSelect }: ModelSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = React.useState<DocumentIntelligenceModel | null>(null);
  const { data: models, isLoading, error } = useDocumentIntelligenceModels();

  if (isLoading) {
    return (
      <Button variant="outline" className="w-[180px]" disabled>
        Ładowanie modeli...
      </Button>
    );
  }

  if (error) {
    return (
      <Button variant="outline" className="w-[180px]" disabled>
        Błąd: {error.message}
      </Button>
    );
  }

  const modelsList = models || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[180px] justify-between"
        >
          {selectedModel ? selectedModel.description : "Wybierz model..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-0">
        <Command>
          <CommandInput placeholder="Szukaj modelu..." />
          <CommandEmpty>Nie znaleziono modelu.</CommandEmpty>
          <CommandGroup>
            {modelsList.map((model) => (
              <CommandItem
                key={model.modelId}
                value={model.modelId}
                onSelect={() => {
                  setSelectedModel(model);
                  onModelSelect(model);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedModel?.modelId === model.modelId ? "opacity-100" : "opacity-0"
                  )}
                />
                {model.description}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 