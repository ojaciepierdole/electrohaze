import type { DocumentField } from './document-processing';

// Typ bazowy dla wszystkich pól dokumentu
type BaseDocumentFields = Record<string, DocumentField>;

// Typ pomocniczy do definiowania pól
type DocumentFieldKeys<T extends string> = Record<T, DocumentField>;

export interface SupplierData extends DocumentFieldKeys<
  | 'supplierName'
  | 'supplierTaxID'
  | 'supplierStreet'
  | 'supplierBuilding'
  | 'supplierUnit'
  | 'supplierPostalCode'
  | 'supplierCity'
  | 'supplierBankAccount'
  | 'supplierBankName'
  | 'supplierEmail'
  | 'supplierPhone'
  | 'supplierWebsite'
  | 'OSD_name'
  | 'OSD_region'
> {}

export interface PPEData extends DocumentFieldKeys<
  | 'ppeNum'
  | 'MeterNumber'
  | 'TariffGroup'
  | 'ContractNumber'
  | 'ContractType'
  | 'dpFirstName'
  | 'dpLastName'
  | 'dpStreet'
  | 'dpBuilding'
  | 'dpUnit'
  | 'dpPostalCode'
  | 'dpCity'
  | 'dpMunicipality'
  | 'dpDistrict'
  | 'dpProvince'
  | 'OSD_name'
  | 'OSD_region'
> {}

export interface CustomerData extends DocumentFieldKeys<
  | 'FirstName'
  | 'LastName'
  | 'BusinessName'
  | 'taxID'
  | 'Street'
  | 'Building'
  | 'Unit'
  | 'PostalCode'
  | 'City'
  | 'Municipality'
  | 'District'
  | 'Province'
> {}

export interface CorrespondenceData extends DocumentFieldKeys<
  | 'paFirstName'
  | 'paLastName'
  | 'paBusinessName'
  | 'paTitle'
  | 'paStreet'
  | 'paBuilding'
  | 'paUnit'
  | 'paPostalCode'
  | 'paCity'
> {}

export interface BillingData extends DocumentFieldKeys<
  | 'billingStartDate'
  | 'billingEndDate'
  | 'billedUsage'
  | 'usage12m'
> {}

// Komponenty adresowe
export interface AddressComponents {
  dpFirstName: string | null;
  dpLastName: string | null;
  dpStreet: string | null;
  dpBuilding: string | null;
  dpUnit: string | null;
  dpPostalCode: string | null;
  dpCity: string | null;
  paFirstName: string | null;
  paLastName: string | null;
  paStreet: string | null;
  paBuilding: string | null;
  paUnit: string | null;
  paPostalCode: string | null;
  paCity: string | null;
  supplierFirstName: string | null;
  supplierLastName: string | null;
  supplierStreet: string | null;
  supplierBuilding: string | null;
  supplierUnit: string | null;
  supplierPostalCode: string | null;
  supplierCity: string | null;
}

// Komponenty osobowe
export interface PersonComponents {
  firstName: string | null;
  lastName: string | null;
  title: string | null;
}

// Znormalizowane komponenty
export interface NormalizedAddress extends AddressComponents {
  confidence: number;
}

export interface NormalizedPerson extends PersonComponents {
  originalName: string | null;
  confidence: number;
}

// Definicje pól Azure
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
 