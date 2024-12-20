import type { FieldWithConfidence, DocumentField } from './processing';
import type { LucideIcon } from 'lucide-react';

/**
 * Dane punktu poboru energii (PPE)
 */
export interface PPEData {
  [key: string]: FieldWithConfidence | undefined;
  ppeNum?: FieldWithConfidence;
  MeterNumber?: FieldWithConfidence;
  TariffGroup?: FieldWithConfidence;
  ContractNumber?: FieldWithConfidence;
  ContractType?: FieldWithConfidence;
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
  paProvince?: FieldWithConfidence;
  paMunicipality?: FieldWithConfidence;
  paDistrict?: FieldWithConfidence;
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
  OSD_region?: FieldWithConfidence;
}

/**
 * Dane rozliczeniowe
 */
export interface BillingData {
  [key: string]: FieldWithConfidence | undefined;
  BillingStartDate?: FieldWithConfidence;
  BillingEndDate?: FieldWithConfidence;
  BilledUsage?: FieldWithConfidence;
  '12mUsage'?: FieldWithConfidence;
  ReadingType?: FieldWithConfidence;
  ProductName?: FieldWithConfidence;
  InvoiceType?: FieldWithConfidence;
  BillBreakdown?: FieldWithConfidence;
  EnergySaleBreakdown?: FieldWithConfidence;
}

/**
 * Dane konsumpcji
 */
export interface ConsumptionData {
  [key: string]: FieldWithConfidence | undefined;
  BilledUsage?: FieldWithConfidence;
  '12mUsage'?: FieldWithConfidence;
  ReadingType?: FieldWithConfidence;
  ConsumptionHistory?: FieldWithConfidence;
  ConsumptionTrend?: FieldWithConfidence;
  PeakUsage?: FieldWithConfidence;
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
  ],
  consumption_info: [
    'BilledUsage',
    '12mUsage',
    'ReadingType'
  ]
} as const;

export type FieldGroupKey = keyof typeof AZURE_FIELDS;

export interface FieldGroup {
  name: FieldGroupKey;
  label: string;
  icon: LucideIcon;
  fields: string[];
  requiredFields: string[];
}

export type FieldName = string;

// Interfejsy dla grup pól
export interface BaseFieldGroup {
  [key: string]: FieldWithConfidence | undefined;
}

export interface PPEData extends BaseFieldGroup {
  ppeNum?: FieldWithConfidence;
  MeterNumber?: FieldWithConfidence;
  TariffGroup?: FieldWithConfidence;
  ContractNumber?: FieldWithConfidence;
  ContractType?: FieldWithConfidence;
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

export interface CustomerData extends BaseFieldGroup {
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

export interface CorrespondenceData extends BaseFieldGroup {
  paFirstName?: FieldWithConfidence;
  paLastName?: FieldWithConfidence;
  paBusinessName?: FieldWithConfidence;
  paTitle?: FieldWithConfidence;
  paStreet?: FieldWithConfidence;
  paBuilding?: FieldWithConfidence;
  paUnit?: FieldWithConfidence;
  paPostalCode?: FieldWithConfidence;
  paCity?: FieldWithConfidence;
  paProvince?: FieldWithConfidence;
  paMunicipality?: FieldWithConfidence;
  paDistrict?: FieldWithConfidence;
}

export interface SupplierData extends BaseFieldGroup {
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
  OSD_region?: FieldWithConfidence;
}

export interface BillingData extends BaseFieldGroup {
  BillingStartDate?: FieldWithConfidence;
  BillingEndDate?: FieldWithConfidence;
  BilledUsage?: FieldWithConfidence;
  '12mUsage'?: FieldWithConfidence;
  ReadingType?: FieldWithConfidence;
  ProductName?: FieldWithConfidence;
  InvoiceType?: FieldWithConfidence;
  BillBreakdown?: FieldWithConfidence;
  EnergySaleBreakdown?: FieldWithConfidence;
}

export interface ConsumptionData extends BaseFieldGroup {
  BilledUsage?: FieldWithConfidence;
  '12mUsage'?: FieldWithConfidence;
  ReadingType?: FieldWithConfidence;
  ConsumptionHistory?: FieldWithConfidence;
  ConsumptionTrend?: FieldWithConfidence;
  PeakUsage?: FieldWithConfidence;
}
 