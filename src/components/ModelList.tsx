import { Check } from 'lucide-react';
import { useDocumentIntelligenceModels } from '@/hooks/useDocumentIntelligenceModels';
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface ModelListProps {
  selectedModels: string[];
  onSelect: (models: string[]) => void;
}

export function ModelList({ selectedModels, onSelect }: ModelListProps) {
  const { data: models = [], isLoading } = useDocumentIntelligenceModels();

  const handleSelect = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelect(selectedModels.filter(id => id !== modelId));
    } else {
      onSelect([...selectedModels, modelId]);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        Ładowanie modeli...
      </div>
    );
  }

  return (
    <>
      <CommandInput placeholder="Wyszukaj model..." />
      <CommandEmpty>Nie znaleziono modeli</CommandEmpty>
      <CommandGroup>
        {models.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          return (
            <CommandItem
              key={model.id}
              onSelect={() => handleSelect(model.id)}
              className="flex items-center justify-between py-3"
            >
              <div className="flex-1">
                <p className="font-medium">{model.name}</p>
                <p className="text-sm text-gray-500">{model.description}</p>
                {model.version && (
                  <p className="text-xs text-gray-400">Wersja: {model.version}</p>
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
    </>
  );
} 