import type { SupplierData, BillingData } from '@/types/fields';

export function formatDate(date: string | null): string {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return date;
  }
}

export function formatConsumption(value: number | null): string {
  if (value === null) return '';
  return `${value.toLocaleString('pl-PL')} kWh`;
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

export function formatSupplierName(value: string | null): string | null {
  if (!value) return null;
  // Usuń wartość "0" i wyczyść tekst
  if (value === "0") return null;
  return value.trim().toUpperCase();
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

export function calculateGroupConfidence(data: Record<string, unknown>, group: string): GroupConfidence {
  const fields = Object.entries(data);
  const filledFields = fields.filter(([_, value]) => value !== null && value !== undefined).length;
  const totalFields = fields.length;
  
  // Oblicz pewności dla poszczególnych pól
  const fieldConfidences = fields.reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = typeof value === 'object' && 'confidence' in value 
        ? (value as { confidence: number }).confidence 
        : 1;
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
  documents: Array<{ fields: Record<string, any> }>
): {
  averageConfidence: number;
  totalFilledFields: number;
  totalFields: number;
  documentsCount: number;
} {
  const documentConfidences = documents.map(doc => calculateDocumentConfidence(doc.fields));

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

export function getMissingFields(
  data: Record<string, unknown>,
  fieldMapping: Record<string, string>
): Array<{ key: string; label: string }> {
  return Object.entries(fieldMapping)
    .filter(([key]) => !data[key])
    .map(([key, label]) => ({ key, label }));
}

interface ColumnField {
  key: string;
  label: string;
}

interface ColumnLayout {
  columns: Array<Array<ColumnField>>;
  gridClass: string;
}

export function calculateOptimalColumns(fields: ColumnField[]): ColumnLayout {
  if (fields.length === 0) {
    return { columns: [], gridClass: 'grid-cols-1' };
  }

  // Oblicz optymalną liczbę kolumn na podstawie liczby pól
  let columnCount: number;
  if (fields.length <= 3) {
    columnCount = fields.length;
  } else if (fields.length <= 6) {
    columnCount = 3;
  } else if (fields.length <= 9) {
    columnCount = 3;
  } else {
    columnCount = 4;
  }

  // Oblicz minimalną liczbę elementów w kolumnie
  const minItemsPerColumn = Math.floor(fields.length / columnCount);
  const extraItems = fields.length % columnCount;

  // Podziel pola na kolumny, starając się zachować równą wysokość
  const columns: Array<Array<ColumnField>> = Array(columnCount).fill(null).map(() => []);
  let currentColumn = 0;

  for (let i = 0; i < fields.length; i++) {
    columns[currentColumn].push(fields[i]);
    currentColumn = (currentColumn + 1) % columnCount;
  }

  // Określ klasę CSS dla gridu z uwzględnieniem responsywności
  const gridClass = 
    columnCount === 1 ? 'grid-cols-1' :
    columnCount === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    columnCount === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

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