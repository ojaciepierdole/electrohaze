import { useState, useEffect } from 'react';

const STORAGE_KEY = 'selected_analysis_models';

interface ModelConfig {
  modelId: string;
  timestamp: number;
}

export function useSelectedModels() {
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return [];
      
      const modelConfigs: ModelConfig[] = JSON.parse(savedData);
      return modelConfigs.map(config => config.modelId);
    } catch (error) {
      console.error('Błąd podczas odczytywania wybranych modeli:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      const modelConfigs: ModelConfig[] = selectedModels.map(modelId => ({
        modelId,
        timestamp: Date.now()
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(modelConfigs));
    } catch (error) {
      console.error('Błąd podczas zapisywania wybranych modeli:', error);
    }
  }, [selectedModels]);

  const addModel = (modelId: string) => {
    if (!selectedModels.includes(modelId)) {
      setSelectedModels(prev => [...prev, modelId]);
    }
  };

  const removeModel = (modelId: string) => {
    setSelectedModels(prev => prev.filter(id => id !== modelId));
  };

  const clearModels = () => {
    setSelectedModels([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Błąd podczas czyszczenia wybranych modeli:', error);
    }
  };

  return {
    selectedModels,
    addModel,
    removeModel,
    clearModels,
    setSelectedModels
  };
} 