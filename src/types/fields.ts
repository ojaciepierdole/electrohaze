import { BillingData } from './processing';

export interface FieldWithConfidence {
  content: string | null;
  confidence: number;
}

export interface CustomerData {
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

export interface PPEData {
  ppeNum?: FieldWithConfidence;
  MeterNumber?: FieldWithConfidence;
  TariffGroup?: FieldWithConfidence;
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
}

export interface CorrespondenceData {
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

export interface SupplierData {
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

export interface FieldMapping {
  [key: string]: string;
}

export interface BillingData {
  billingStartDate?: FieldWithConfidence;
  billingEndDate?: FieldWithConfidence;
  billedUsage?: FieldWithConfidence;
  usage12m?: FieldWithConfidence;
}

export type { BillingData };
 