import { BillingData } from './processing';

export interface CustomerData {
  FirstName?: string;
  LastName?: string;
  BusinessName?: string;
  taxID?: string;
  Street?: string;
  Building?: string;
  Unit?: string;
  PostalCode?: string;
  City?: string;
  Municipality?: string;
  District?: string;
  Province?: string;
}

export interface PPEData {
  ppeNum?: string;
  MeterNumber?: string;
  TariffGroup?: string;
  ContractNumber?: string;
  ContractType?: string;
  OSD_name?: string;
  OSD_region?: string;
  ProductName?: string;
  dpFirstName?: string;
  dpLastName?: string;
  dpStreet?: string;
  dpBuilding?: string;
  dpUnit?: string;
  dpPostalCode?: string;
  dpCity?: string;
}

export interface CorrespondenceData {
  paFirstName?: string;
  paLastName?: string;
  paBusinessName?: string;
  paTitle?: string;
  paStreet?: string;
  paBuilding?: string;
  paUnit?: string;
  paPostalCode?: string;
  paCity?: string;
}

export interface SupplierData {
  supplierName?: string;
  supplierTaxID?: string;
  supplierStreet?: string;
  supplierBuilding?: string;
  supplierUnit?: string;
  supplierPostalCode?: string;
  supplierCity?: string;
  supplierBankAccount?: string;
  supplierBankName?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  supplierWebsite?: string;
  OSD_name?: string;
}

export interface FieldMapping {
  [key: string]: string;
}

export type { BillingData };
 