// Eksport typów
export * from './types';

// Eksport słowników
export * from './dictionaries/names';

// Eksport funkcji do przetwarzania osób
export * from './person';

// Eksport funkcji do przetwarzania adresów
export * from './address';

// Eksport funkcji do przetwarzania liczb i dat
export * from './numbers';

// Eksport funkcji do przetwarzania danych dostawcy
export * from './supplier';

// Eksport funkcji do przetwarzania danych rozliczeniowych
export * from './billing';

// Eksport funkcji pomocniczych
export function calculateGroupConfidence(data: Record<string, { content?: string | null; confidence?: number }>, group: string) {
  const fields = Object.entries(data);
  const filledFields = fields.filter(([_, value]) => {
    if (typeof value === 'object' && value !== null) {
      if ('content' in value) {
        return value.content !== null && value.content !== undefined;
      }
    }
    return value !== null && value !== undefined;
  }).length;
  const totalFields = fields.length;
  
  // Oblicz pewności dla poszczególnych pól
  const fieldConfidences = fields.reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && 'confidence' in value && typeof value.confidence === 'number') {
        acc[key] = value.confidence;
      } else {
        acc[key] = 1;
      }
    }
    return acc;
  }, {} as Record<string, number>);

  // Oblicz średnią pewność dla wypełnionych pól
  const confidenceValues = Object.values(fieldConfidences);
  const averageConfidence = confidenceValues.length > 0
    ? confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
    : 0;

  return {
    filledFields,
    totalFields,
    averageConfidence,
    fieldConfidences
  };
}

export function calculateDocumentConfidence(fields: Record<string, { content?: string | null; confidence?: number }>) {
  const allFields = Object.values(fields);
  const filledFields = allFields.filter(f => f?.content);
  const confidenceSum = filledFields.reduce((sum, f) => sum + (f.confidence ?? 1), 0);

  return {
    totalFields: allFields.length,
    totalFilledFields: filledFields.length,
    averageConfidence: filledFields.length > 0 ? confidenceSum / filledFields.length : 0
  };
}

export function aggregateDocumentsConfidence(documents: Array<{ fields: Record<string, { content?: string | null; confidence?: number }> }>) {
  const stats = {
    documentsCount: documents.length,
    totalFields: 0,
    totalFilledFields: 0,
    totalConfidence: 0,
    averageConfidence: 0
  };

  documents.forEach(doc => {
    const fields = Object.values(doc.fields);
    stats.totalFields += fields.length;
    
    const filledFields = fields.filter(f => f?.content);
    stats.totalFilledFields += filledFields.length;
    
    const confidenceSum = filledFields.reduce((sum, f) => sum + (f.confidence ?? 1), 0);
    stats.totalConfidence += confidenceSum;
  });

  stats.averageConfidence = stats.totalFilledFields > 0 
    ? stats.totalConfidence / stats.totalFilledFields 
    : 0;

  return stats;
}

export function getMissingFields(
  data: Record<string, unknown>,
  fieldMapping: Record<string, string>
): Array<{ key: string; label: string }> {
  return Object.entries(fieldMapping)
    .filter(([key]) => !data[key])
    .map(([key, label]) => ({ key, label }));
}

export function calculateOptimalColumns(fields: Array<{ key: string; label: string }>) {
  const totalFields = fields.length;
  const numColumns = 4;
  
  // Oblicz ile pól powinno być w każdej kolumnie
  const fieldsPerColumn = Math.ceil(totalFields / numColumns);

  // Podziel pola na kolumny
  const columns = Array.from({ length: numColumns }, (_, columnIndex) => {
    const start = columnIndex * fieldsPerColumn;
    const end = Math.min(start + fieldsPerColumn, totalFields);
    return fields.slice(start, end);
  }).filter(column => column.length > 0); // Usuń puste kolumny

  // Zawsze używaj 4 kolumn z responsywnością
  const gridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return { columns, gridClass };
}

const SELECTED_MODELS_KEY = 'selectedOcrModels';

export function saveSelectedModels(modelIds: string[]): void {
  try {
    const modelConfigs = modelIds.map(modelId => ({
      modelId,
      timestamp: Date.now()
    }));
    localStorage.setItem(SELECTED_MODELS_KEY, JSON.stringify(modelConfigs));
  } catch (error) {
    console.error('Błąd podczas zapisywania wybranych modeli:', error);
  }
}

export function getSelectedModels(): string[] {
  try {
    const savedData = localStorage.getItem(SELECTED_MODELS_KEY);
    if (!savedData) return [];
    
    const modelConfigs = JSON.parse(savedData);
    return modelConfigs.map((config: { modelId: string }) => config.modelId);
  } catch (error) {
    console.error('Błąd podczas odczytywania wybranych modeli:', error);
    return [];
  }
}

export function clearSelectedModels(): void {
  try {
    localStorage.removeItem(SELECTED_MODELS_KEY);
  } catch (error) {
    console.error('Błąd podczas czyszczenia wybranych modeli:', error);
  }
}

import type { FieldWithConfidence } from '@/types/processing';

export function shouldProcessField(field: FieldWithConfidence | undefined | null, threshold = 0.3): boolean {
  if (!field?.content) return false;
  return field.confidence >= threshold;
} 