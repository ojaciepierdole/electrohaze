export interface CustomerData {
  FirstName?: string;
  LastName?: string;
  BusinessName?: string;
  taxID?: string;
}

export interface PPEData {
  ppeNum?: string;
  Street?: string;
  Building?: string;
  Unit?: string;
  PostalCode?: string;
  City?: string;
}

export interface DeliveryPointData {
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
  OSD_name?: string;
  OSD_region?: string;
  ProductName?: string;
  Tariff?: string;
}

export interface BillingData {
  BillingStartDate?: string;
  BillingEndDate?: string;
  InvoiceType?: string;
  BilledUsage?: string;
  ReadingType?: string;
  "12mUsage"?: string;
  BillBreakdown?: string;
  EnergySaleBreakdown?: string;
}

export interface FieldMapping {
  [key: string]: string;
} 