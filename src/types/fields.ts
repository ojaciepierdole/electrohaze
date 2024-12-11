export interface CustomerData {
  FirstName?: string;
  LastName?: string;
  BusinessName?: string;
  taxID?: string;
}

export interface PPEData {
  ppeNum?: string;
  MeterNumber?: string;
  TariffGroup?: string;
  ContractNumber?: string;
  ContractType?: string;
  Street?: string;
  Building?: string;
  Unit?: string;
  PostalCode?: string;
  City?: string;
  Municipality?: string;
  District?: string;
  Province?: string;
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
  OSD_region?: string;
}

export interface BillingData {
  BillingStartDate?: string;
  BillingEndDate?: string;
  ProductName?: string;
  Tariff?: string;
  BilledUsage?: string;
  ReadingType?: string;
  usage12m?: string;
  InvoiceType?: string;
  BillBreakdown?: string;
  EnergySaleBreakdown?: string;
}

export interface FieldMapping {
  [key: string]: string;
}

export interface DeliveryPointField {
  dpFirstName?: string | null;
  dpLastName?: string | null;
  dpStreet?: string | null;
  dpBuilding?: string | null;
  dpUnit?: string | null;
  dpPostalCode?: string | null;
  dpCity?: string | null;
} 