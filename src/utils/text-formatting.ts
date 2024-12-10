export function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    return dateString.split('T')[0];
  } catch {
    return dateString;
  }
}

export function formatConsumption(value: string | null): string | null {
  if (!value) return null;
  try {
    // Usuń wszystkie spacje i zamień przecinki na kropki
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    // Spróbuj przekonwertować na liczbę
    const number = parseFloat(normalized);
    if (isNaN(number)) return value;
    // Formatuj z użyciem polskiej notacji (przecinek jako separator dziesiętny)
    return `${number.toLocaleString('pl-PL', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 3 
    })} kWh`;
  } catch {
    return value;
  }
}

export function formatAddress(value: string | null): string | null {
  if (!value) return null;
  return value.toUpperCase();
}

export function formatPersonName(value: string | null): string | null {
  if (!value) return null;
  return value.toUpperCase();
}

export interface GroupConfidence {
  totalFields: number;
  filledFields: number;
  averageConfidence: number;
}

export function calculateGroupConfidence(fields: Record<string, any>): GroupConfidence {
  const totalFields = Object.keys(fields).length;
  const filledFields = Object.values(fields).filter(v => v !== null && v !== undefined).length;
  const confidenceSum = Object.values(fields).reduce((sum, v) => {
    if (typeof v === 'number') return sum + v;
    if (typeof v === 'string' && v.length > 0) return sum + 1;
    return sum;
  }, 0);

  return {
    totalFields,
    filledFields,
    averageConfidence: filledFields > 0 ? confidenceSum / filledFields : 0
  };
}

export function getMissingFields<T extends Record<string, any>>(
  data: T, 
  fieldMappings: Record<string, string>
): Array<{ label: string; key: keyof T }> {
  return Object.entries(fieldMappings)
    .filter(([key]) => !data[key])
    .map(([key, label]) => ({
      label,
      key: key as keyof T
    }));
}

export interface ColumnLayout {
  columns: Array<Array<{ key: string; label: string }>>;
  gridClass: string;
}

export function calculateOptimalColumns(missingFields: Array<{ key: string; label: string }>): ColumnLayout {
  if (missingFields.length === 0) {
    return { columns: [], gridClass: 'grid-cols-1' };
  }

  let columnCount: number;
  
  // Nowa logika podziału na kolumny
  if (missingFields.length >= 6 && missingFields.length <= 8) {
    // Dla 6-8 pól używamy 4 kolumn
    columnCount = 4;
  } else if (missingFields.length >= 3 && missingFields.length <= 4) {
    // Dla 3-4 pól używamy tylu kolumn ile jest pól (jeden wiersz)
    columnCount = missingFields.length;
  } else if (missingFields.length > 8) {
    // Dla więcej niż 8 pól używamy 4 kolumn
    columnCount = 4;
  } else {
    // Dla 1-2 pól używamy tylu kolumn ile jest pól
    columnCount = missingFields.length;
  }

  // Oblicz bazową liczbę elementów w kolumnie
  const baseItemsPerColumn = Math.floor(missingFields.length / columnCount);
  // Oblicz ile kolumn będzie miało dodatkowy element
  const extraItems = missingFields.length % columnCount;

  // Podziel pola na kolumny
  const columns: Array<Array<{ key: string; label: string }>> = [];
  let currentIndex = 0;

  for (let i = 0; i < columnCount; i++) {
    const itemsInThisColumn = baseItemsPerColumn + (i < extraItems ? 1 : 0);
    columns.push(missingFields.slice(currentIndex, currentIndex + itemsInThisColumn));
    currentIndex += itemsInThisColumn;
  }

  // Określ klasę CSS dla gridu
  const gridClass = columnCount === 1 ? 'grid-cols-1' :
                   columnCount === 2 ? 'grid-cols-2' :
                   columnCount === 3 ? 'grid-cols-3' :
                   'grid-cols-4';

  return { columns, gridClass };
} 

const SELECTED_MODELS_KEY = 'selectedOcrModels';

export interface SavedModelConfig {
  modelId: string;
  timestamp: number;
}

export function saveSelectedModels(modelIds: string[]): void {
  try {
    const modelConfigs: SavedModelConfig[] = modelIds.map(modelId => ({
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
    
    const modelConfigs: SavedModelConfig[] = JSON.parse(savedData);
    return modelConfigs.map(config => config.modelId);
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