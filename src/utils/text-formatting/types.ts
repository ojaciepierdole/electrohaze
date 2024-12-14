export interface FieldWithConfidence {
  content: string | null;
  confidence: number;
}

export interface GroupConfidence {
  averageConfidence: number;  // średnia pewność dla wypełnionych pól
  filledFields: number;       // liczba wypełnionych pól
  totalFields: number;        // całkowita liczba pól
  fieldConfidences: Record<string, number>; // pewności dla poszczególnych pól
}

export interface DocumentConfidence {
  groups: Record<string, GroupConfidence>;
  averageConfidence: number;  // średnia pewność dla całego dokumentu
  totalFilledFields: number;  // suma wypełnionych pól
  totalFields: number;        // suma wszystkich pól
}

export interface SavedModelConfig {
  modelId: string;
  timestamp: number;
}

export interface ColumnField {
  key: string;
  label: string;
}

export interface ColumnLayout {
  columns: Array<Array<ColumnField>>;
  gridClass: string;
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