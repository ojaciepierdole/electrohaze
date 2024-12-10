'use client';

import { useState } from 'react';
import { DocumentIntelligenceModel } from '@/types/documentIntelligence';

export function useModel() {
  const [selectedModel, setSelectedModel] = useState<DocumentIntelligenceModel | null>(null);

  const selectModel = (model: DocumentIntelligenceModel) => {
    setSelectedModel(model);
  };

  const clearModel = () => {
    setSelectedModel(null);
  };

  return {
    selectedModel,
    selectModel,
    clearModel
  };
} 