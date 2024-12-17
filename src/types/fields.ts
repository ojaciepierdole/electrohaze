import type { FieldWithConfidence, DocumentField } from './processing';

/**
 * Dane punktu poboru energii (PPE)
 */
export interface PPEData {
  [key: string]: FieldWithConfidence | undefined;
  ppeNum?: FieldWithConfidence;
  MeterNumber?: FieldWithConfidence;
  Tariff?: FieldWithConfidence;
  ContractNumber?: FieldWithConfidence;
  ContractType?: FieldWithConfidence;
  OSD_name?: FieldWithConfidence;
  OSD_region?: FieldWithConfidence;
  ProductName?: FieldWithConfidence;
  dpFirstName?: FieldWithConfidence;
  dpLastName?: FieldWithConfidence;
  dpStreet?: FieldWithConfidence;
  dpBuilding?: FieldWithConfidence;
  dpUnit?: FieldWithConfidence;
  dpPostalCode?: FieldWithConfidence;
  dpCity?: FieldWithConfidence;
  dpProvince?: FieldWithConfidence;
  dpMunicipality?: FieldWithConfidence;
  dpDistrict?: FieldWithConfidence;
  dpMeterID?: FieldWithConfidence;
}

/**
 * Dane klienta
 */
export interface CustomerData {
  [key: string]: FieldWithConfidence | undefined;
  FirstName?: FieldWithConfidence;
  LastName?: FieldWithConfidence;
  BusinessName?: FieldWithConfidence;
  taxID?: FieldWithConfidence;
  Street?: FieldWithConfidence;
  Building?: FieldWithConfidence;
  Unit?: FieldWithConfidence;
  PostalCode?: FieldWithConfidence;
  City?: FieldWithConfidence;
  Municipality?: FieldWithConfidence;
  District?: FieldWithConfidence;
  Province?: FieldWithConfidence;
}

/**
 * Dane adresu korespondencyjnego
 */
export interface CorrespondenceData {
  [key: string]: FieldWithConfidence | undefined;
  paFirstName?: FieldWithConfidence;
  paLastName?: FieldWithConfidence;
  paBusinessName?: FieldWithConfidence;
  paTitle?: FieldWithConfidence;
  paStreet?: FieldWithConfidence;
  paBuilding?: FieldWithConfidence;
  paUnit?: FieldWithConfidence;
  paPostalCode?: FieldWithConfidence;
  paCity?: FieldWithConfidence;
}

/**
 * Dane dostawcy
 */
export interface SupplierData {
  [key: string]: FieldWithConfidence | undefined;
  supplierName?: FieldWithConfidence;
  supplierTaxID?: FieldWithConfidence;
  supplierStreet?: FieldWithConfidence;
  supplierBuilding?: FieldWithConfidence;
  supplierUnit?: FieldWithConfidence;
  supplierPostalCode?: FieldWithConfidence;
  supplierCity?: FieldWithConfidence;
  supplierBankAccount?: FieldWithConfidence;
  supplierBankName?: FieldWithConfidence;
  supplierEmail?: FieldWithConfidence;
  supplierPhone?: FieldWithConfidence;
  supplierWebsite?: FieldWithConfidence;
  OSD_name?: FieldWithConfidence;
}

/**
 * Dane rozliczeniowe
 */
export interface BillingData {
  [key: string]: FieldWithConfidence | undefined;
  billingStartDate?: FieldWithConfidence;
  billingEndDate?: FieldWithConfidence;
  billedUsage?: FieldWithConfidence;
  usage12m?: FieldWithConfidence;
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
 