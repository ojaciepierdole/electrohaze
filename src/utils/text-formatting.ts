import type { SupplierData, BillingData } from '@/types/fields';

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

export function formatPostalCode(value: string | null): string | null {
  if (!value) return null;
  // Usuń wszystkie białe znaki i formatuj jako XX-XXX
  const cleaned = value.replace(/\s+/g, '');
  if (cleaned.length === 5) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
  }
  return value;
}

export function formatCity(value: string | null): string | null {
  if (!value) return null;
  // Zamień pierwszą literę na wielką, resztę na małe
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function formatStreet(value: string | null): string | null {
  if (!value) return null;
  // Zamień pierwszą literę każdego słowa na wielką
  return value
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Definicje typów dla pól Azure
export const AZURE_FIELDS = {
  delivery_point: [
    'dpFirstName',
    'dpLastName',
    'dpStreet',
    'dpBuilding',
    'dpUnit',
    'dpPostalCode',
    'dpCity'
  ],
  ppe: [
    'ppeNum',
    'MeterNumber',
    'TariffGroup',
    'ContractNumber',
    'ContractType',
    'Street',
    'Building',
    'Unit',
    'PostalCode',
    'City',
    'Municipality',
    'District',
    'Province'
  ],
  postal_address: [
    'paFirstName',
    'paLastName',
    'paBusinessName',
    'paTitle',
    'paStreet',
    'paBuilding',
    'paUnit',
    'paPostalCode',
    'paCity'
  ],
  buyer_data: [
    'FirstName',
    'LastName',
    'BusinessName',
    'taxID'
  ],
  supplier: [
    'supplierName',
    'OSD_name',
    'OSD_region'
  ],
  billing: [
    'BillingStartDate',
    'BillingEndDate',
    'ProductName',
    'Tariff',
    'BilledUsage',
    'ReadingType',
    '12mUsage',
    'InvoiceType',
    'BillBreakdown',
    'EnergySaleBreakdown'
  ]
} as const;

export type FieldGroupKey = keyof typeof AZURE_FIELDS;

export interface FieldConfidence {
  value: string | null;
  confidence: number;
}

export interface GroupConfidence {
  averageConfidence: number;  // średnia pewność dla wypełnionych pól
  filledFields: number;       // liczba wypełnionych pól
  totalFields: number;        // całkowita liczba pól
  fieldConfidences: Record<string, number>; // pewności dla poszczególnych pól
}

export interface DocumentConfidence {
  groups: Record<FieldGroupKey, GroupConfidence>;
  averageConfidence: number;  // średnia pewność dla całego dokumentu
  totalFilledFields: number;  // suma wypełnionych pól
  totalFields: number;        // suma wszystkich pól
}

export function calculateGroupConfidence(
  fields: Record<string, any>,
  groupType: FieldGroupKey
): GroupConfidence {
  const azureFields = AZURE_FIELDS[groupType];
  const totalFields = azureFields.length;

  // Filtruj tylko pola, które są zdefiniowane w AZURE_FIELDS dla danej grupy
  const relevantFields = Object.entries(fields)
    .filter(([key]) => (azureFields as readonly string[]).includes(key));

  // Zbierz wypełnione pola i ich pewności
  const filledFieldsWithConfidence = relevantFields
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([key, value]) => ({
      key,
      confidence: value?.confidence || 0
    }));

  const filledFields = filledFieldsWithConfidence.length;

  // Zbierz pewności dla wszystkich pól
  const fieldConfidences = filledFieldsWithConfidence.reduce((acc, { key, confidence }) => ({
    ...acc,
    [key]: confidence
  }), {} as Record<string, number>);

  // Oblicz średnią pewność tylko dla wypełnionych pól
  const confidenceSum = filledFieldsWithConfidence.reduce((sum, { confidence }) => sum + confidence, 0);
  const averageConfidence = filledFields > 0 ? confidenceSum / filledFields : 0;

  return {
    averageConfidence,
    filledFields,
    totalFields,
    fieldConfidences
  };
}

export function calculateDocumentConfidence(
  documentFields: Record<string, any>
): DocumentConfidence {
  // Oblicz statystyki dla każdej grupy
  const groups = Object.keys(AZURE_FIELDS).reduce((acc, groupKey) => ({
    ...acc,
    [groupKey]: calculateGroupConfidence(documentFields, groupKey as FieldGroupKey)
  }), {} as Record<FieldGroupKey, GroupConfidence>);

  // Oblicz sumy dla całego dokumentu
  const totalFilledFields = Object.values(groups).reduce(
    (sum, group) => sum + group.filledFields, 
    0
  );

  const totalFields = Object.values(groups).reduce(
    (sum, group) => sum + group.totalFields, 
    0
  );

  // Oblicz średnią pewność ważoną liczbą wypełnionych pól
  const weightedConfidenceSum = Object.values(groups).reduce(
    (sum, group) => sum + (group.averageConfidence * group.filledFields),
    0
  );

  const averageConfidence = totalFilledFields > 0 
    ? weightedConfidenceSum / totalFilledFields 
    : 0;

  return {
    groups,
    averageConfidence,
    totalFilledFields,
    totalFields
  };
}

export function aggregateDocumentsConfidence(
  documents: Array<{ modelResults: Array<{ fields: Record<string, any> }> }>
): {
  averageConfidence: number;
  totalFilledFields: number;
  totalFields: number;
  documentsCount: number;
} {
  const documentConfidences = documents.map(doc => {
    // Agreguj pola ze wszystkich modeli
    const allFields = doc.modelResults.reduce((acc, model) => ({
      ...acc,
      ...model.fields
    }), {});
    return calculateDocumentConfidence(allFields);
  });

  const totalFilledFields = documentConfidences.reduce(
    (sum, doc) => sum + doc.totalFilledFields,
    0
  );

  const totalFields = documentConfidences.reduce(
    (sum, doc) => sum + doc.totalFields,
    0
  );

  // Oblicz średnią pewność ważoną liczbą wypełnionych pól
  const weightedConfidenceSum = documentConfidences.reduce(
    (sum, doc) => sum + (doc.averageConfidence * doc.totalFilledFields),
    0
  );

  const averageConfidence = totalFilledFields > 0
    ? weightedConfidenceSum / totalFilledFields
    : 0;

  return {
    averageConfidence,
    totalFilledFields,
    totalFields,
    documentsCount: documents.length
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