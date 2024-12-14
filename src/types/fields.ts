import { FieldWithConfidence } from './processing';
import { DocumentField } from './document-processing';

// Typ bazowy dla wszystkich pól dokumentu
type BaseDocumentFields = Record<string, DocumentField>;

// Typ pomocniczy do definiowania pól
type DocumentFieldKeys<T extends string> = Record<T, DocumentField>;

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

export interface PPEData extends DocumentFieldKeys<
  | 'ppeNum'
  | 'MeterNumber'
  | 'Tariff'
  | 'ContractNumber'
  | 'ContractType'
  | 'OSD_name'
  | 'OSD_region'
  | 'ProductName'
  | 'dpFirstName'
  | 'dpLastName'
  | 'dpStreet'
  | 'dpBuilding'
  | 'dpUnit'
  | 'dpPostalCode'
  | 'dpCity'
  | 'EnergySaleBreakdown'
  | 'FortumZuzycie'
  | 'BillBreakdown'
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

export interface BillingData extends DocumentFieldKeys<
  | 'billingStartDate'
  | 'billingEndDate'
  | 'billedUsage'
  | 'usage12m'
> {}
 