import type { DocumentField } from './document';

/**
 * Dane punktu poboru energii (PPE)
 */
export interface PPEData {
  ppeNum: DocumentField;
  MeterNumber: DocumentField;
  TariffGroup: DocumentField;
  ContractNumber?: DocumentField;
  ContractType?: DocumentField;
  dpStreet?: DocumentField;
  dpBuilding?: DocumentField;
  dpUnit?: DocumentField;
  dpPostalCode?: DocumentField;
  dpCity?: DocumentField;
  Municipality?: DocumentField;
  District?: DocumentField;
  Province?: DocumentField;
  [key: string]: DocumentField | undefined;
}

/**
 * Dane klienta
 */
export interface CustomerData {
  FirstName?: DocumentField;
  LastName?: DocumentField;
  BusinessName?: DocumentField;
  taxID?: DocumentField;
  Street?: DocumentField;
  Building?: DocumentField;
  Unit?: DocumentField;
  PostalCode?: DocumentField;
  City?: DocumentField;
  [key: string]: DocumentField | undefined;
}

/**
 * Dane adresu korespondencyjnego
 */
export interface CorrespondenceData {
  paFirstName?: DocumentField;
  paLastName?: DocumentField;
  paBusinessName?: DocumentField;
  paTitle?: DocumentField;
  paStreet?: DocumentField;
  paBuilding?: DocumentField;
  paUnit?: DocumentField;
  paPostalCode?: DocumentField;
  paCity?: DocumentField;
  [key: string]: DocumentField | undefined;
}

/**
 * Dane dostawcy
 */
export interface SupplierData {
  supplierName: DocumentField;
  supplierTaxID: DocumentField;
  supplierStreet?: DocumentField;
  supplierBuilding?: DocumentField;
  supplierUnit?: DocumentField;
  supplierPostalCode?: DocumentField;
  supplierCity?: DocumentField;
  supplierBankAccount?: DocumentField;
  supplierBankName?: DocumentField;
  supplierEmail?: DocumentField;
  supplierPhone?: DocumentField;
  supplierWebsite?: DocumentField;
  OSD_name?: DocumentField;
  OSD_region?: DocumentField;
  [key: string]: DocumentField | undefined;
}

/**
 * Dane rozliczeniowe
 */
export interface BillingData {
  billingStartDate?: DocumentField;
  billingEndDate?: DocumentField;
  billedUsage?: DocumentField;
  '12mUsage'?: DocumentField;
  [key: string]: DocumentField | undefined;
}

// Komponenty adresowe
export interface AddressComponents {
  dpFirstName: DocumentField | null;
  dpLastName: DocumentField | null;
  dpStreet: DocumentField | null;
  dpBuilding: DocumentField | null;
  dpUnit: DocumentField | null;
  dpPostalCode: DocumentField | null;
  dpCity: DocumentField | null;
  paFirstName: DocumentField | null;
  paLastName: DocumentField | null;
  paStreet: DocumentField | null;
  paBuilding: DocumentField | null;
  paUnit: DocumentField | null;
  paPostalCode: DocumentField | null;
  paCity: DocumentField | null;
  supplierFirstName: DocumentField | null;
  supplierLastName: DocumentField | null;
  supplierStreet: DocumentField | null;
  supplierBuilding: DocumentField | null;
  supplierUnit: DocumentField | null;
  supplierPostalCode: DocumentField | null;
  supplierCity: DocumentField | null;
}

// Komponenty osobowe
export interface PersonComponents {
  firstName: DocumentField | null;
  lastName: DocumentField | null;
  title: DocumentField | null;
}

// Znormalizowane komponenty
export interface NormalizedAddress extends AddressComponents {
  confidence: number;
}

export interface NormalizedPerson extends PersonComponents {
  originalName: DocumentField | null;
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
 