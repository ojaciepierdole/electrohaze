'use client';

import React, { createContext, useContext, useState } from 'react';
import { DocumentIntelligenceModel } from '@/types/documentIntelligence';

interface ModelContextType {
  selectedModel: DocumentIntelligenceModel | null;
  setSelectedModel: (model: DocumentIntelligenceModel | null) => void;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<DocumentIntelligenceModel | null>(null);

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
} 