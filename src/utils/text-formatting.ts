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
    'supplierTaxID',
    'supplierStreet',
    'supplierBuilding',
    'supplierUnit',
    'supplierPostalCode',
    'supplierCity',
    'supplierBankAccount',
    'supplierBankName',
    'supplierEmail',
    'supplierPhone',
    'supplierWebsite',
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

export function calculateGroupConfidence(
  fields: Record<string, any>,
  groupType: FieldGroupKey
): { averageConfidence: number; filledFields: number; totalFields: number } {
  const azureFields = AZURE_FIELDS[groupType];
  const totalFields = azureFields.length;

  // Filtruj tylko pola, które są zdefiniowane w AZURE_FIELDS dla danej grupy
  const relevantFields = Object.entries(fields)
    .filter(([key]) => (azureFields as readonly string[]).includes(key));

  // Zlicz wypełnione pola (nie null, nie undefined, nie pusty string)
  const filledFields = relevantFields.filter(([_, v]) => 
    v !== null && v !== undefined && v !== ''
  ).length;

  // Oblicz średnią pewność tylko dla wypełnionych pól
  const confidenceSum = relevantFields
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .reduce((sum, [_, value]) => sum + (value?.confidence || 0), 0);

  return {
    averageConfidence: filledFields > 0 ? confidenceSum / filledFields : 0,
    filledFields,
    totalFields
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