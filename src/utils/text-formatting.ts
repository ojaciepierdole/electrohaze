import type { SupplierData, BillingData } from '@/types/fields';

// Pomocnicza funkcja do normalizacji formatu daty
function normalizeDate(date: string): string {
  // Usuń zbędne białe znaki
  date = date.trim();
  
  // Obsługa różnych separatorów
  date = date.replace(/[./]/g, '-');
  
  // Sprawdź czy data jest w formacie DD-MM-YYYY
  const ddmmyyyy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  if (ddmmyyyy.test(date)) {
    const [_, day, month, year] = ddmmyyyy.exec(date) || [];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Sprawdź czy data jest w formacie YYYY-MM-DD
  const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  if (yyyymmdd.test(date)) {
    const [_, year, month, day] = yyyymmdd.exec(date) || [];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Sprawdź czy data jest w formacie DD.MM.YYYY
  const ddmmyyyyDot = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  if (ddmmyyyyDot.test(date)) {
    const [_, day, month, year] = ddmmyyyyDot.exec(date) || [];
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return date;
}

// Pomocnicza funkcja do walidacji daty
function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

export function formatDate(date: string | null): string {
  if (!date) return '';
  
  try {
    // Normalizuj format daty
    const normalizedDate = normalizeDate(date);
    
    // Konwertuj na obiekt Date
    const dateObj = new Date(normalizedDate);
    
    // Sprawdź czy data jest poprawna
    if (!isValidDate(dateObj)) {
      console.warn(`Invalid date format: ${date}`);
      return 'Nieprawidłowa data';
    }
    
    // Formatuj datę
    return dateObj.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error(`Error formatting date: ${date}`, error);
    return 'Nieprawidłowa data';
  }
}

export function formatConsumption(value: number | null): string {
  if (value === null) return '';
  return `${value.toLocaleString('pl-PL')} kWh`;
}

export function formatAddress(value: string | null): string | null {
  if (!value) return null;
  return value.replace(/,+$/, '').toUpperCase();
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

export function formatProvince(value: string | null): string | null {
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

export function calculateGroupConfidence(data: Record<string, { content?: string | null; confidence?: number }>, group: string): GroupConfidence {
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

interface ColumnField {
  key: string;
  label: string;
}

interface ColumnLayout {
  columns: Array<Array<ColumnField>>;
  gridClass: string;
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