'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ModelDefinition } from '@/types/processing';

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
  const handleModelToggle = (modelId: string) => {
    const newSelection = selectedModels.includes(modelId)
      ? selectedModels.filter(id => id !== modelId)
      : [...selectedModels, modelId];
    onSelectionChange(newSelection);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-sm text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-sm font-medium">Wybierz modele do analizy:</div>
          <div className="grid gap-4">
            {models.map((model) => (
              <div key={model.id} className="flex items-center space-x-2">
                <Checkbox
                  id={model.id}
                  checked={selectedModels.includes(model.id)}
                  onCheckedChange={() => handleModelToggle(model.id)}
                />
                <label
                  htmlFor={model.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {model.name}
                  {model.description && (
                    <span className="text-xs text-gray-500 block mt-1">
                      {model.description}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 