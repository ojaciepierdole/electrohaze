import { DocumentField } from '@azure/ai-form-recognizer';
import { AbortSignalLike } from '@azure/abort-controller';
import { Alert } from '@/lib/alert-service';
import { 
  ISODateString, 
  AddressData, 
  PersonData, 
  BillingPeriod, 
  BaseDataGroup 
} from './common';

export interface FieldWithConfidence {
  content: string | null;
  confidence: number;
}

export type FieldGroupKey = 
  | 'buyer_data'
  | 'delivery_point'
  | 'consumption_info'
  | 'postal_address'
  | 'supplier'
  | 'billing';

export interface FieldGroup {
  label: string;
  description?: string;
  icon?: string;
  order: number;
}

export interface FieldDefinition {
  name: string;
  type: string;
  isRequired: boolean;
  description: string;
  group: FieldGroupKey;
}

export interface ProcessedField {
  confidence: number;
  fieldType: string;
  content?: string;
  page?: number;
  definition: {
    name: string;
    type: string;
    isRequired: boolean;
    description: string;
    group: FieldGroupKey;
  };
}

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

export interface SupplierData {
  [key: string]: FieldWithConfidence | undefined;
  supplierName?: FieldWithConfidence;
  spTaxID?: FieldWithConfidence;
  spStreet?: FieldWithConfidence;
  spBuilding?: FieldWithConfidence;
  spUnit?: FieldWithConfidence;
  spPostalCode?: FieldWithConfidence;
  spCity?: FieldWithConfidence;
  spProvince?: FieldWithConfidence;
  spMunicipality?: FieldWithConfidence;
  spDistrict?: FieldWithConfidence;
  spIBAN?: FieldWithConfidence;
  spPhoneNum?: FieldWithConfidence;
  spWebUrl?: FieldWithConfidence;
  OSD_name?: FieldWithConfidence;
}

export interface BillingData {
  [key: string]: FieldWithConfidence | undefined;
  billingStartDate?: FieldWithConfidence;
  billingEndDate?: FieldWithConfidence;
  billedUsage?: FieldWithConfidence;
  usage12m?: FieldWithConfidence;
}

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

export interface DocumentAnalysisResult {
  [key: string]: unknown;
  fileName?: string;
  fileUrl?: string;
  ppeData?: PPEData;
  correspondenceData?: CorrespondenceData;
  supplierData?: SupplierData;
  billingData?: BillingData;
  customerData?: CustomerData;
}

export interface BatchProcessingStatus {
  isProcessing: boolean;
  currentFileIndex: number;
  currentFileName: string | null;
  currentModelIndex: number;
  currentModelId: string | null;
  fileProgress: number;
  totalProgress: number;
  totalFiles: number;
  results: ProcessingResult[];
  error: string | null;
}

export interface ModelResult {
  modelId: string;
  fields: Record<string, DocumentField>;
  confidence: number;
  pageCount: number;
}

export interface ProcessingResult {
  fileName: string;
  modelResults: ModelResult[];
  processingTime: number;
  mappedData: DocumentAnalysisResult;
  confidence: number;
  cacheStats: {
    size: number;
    maxSize: number;
    ttl: number;
  };
  performanceStats?: PerformanceStats[];
  alerts?: Alert[];
}

export interface AnalysisField {
  name: string;
  type: string;
  isRequired: boolean;
  description?: string;
  group: FieldGroupKey;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  type: 'prebuilt' | 'custom';
  category: string;
  version?: string;
}

export interface AnalysisLogEntry {
  timestamp: Date;
  supplierName: string;
  timings: {
    totalTime: number;
    azureResponseTime: number;
    processingTime: number;
  };
  extractedFields: Record<string, string | null>;
}

export interface GroupedResult {
  fileName: string;
  modelResults: Array<{
    modelId: string;
    fields: Record<string, ProcessedField>;
    confidence: number;
    pageCount: number;
  }>;
}

export type AddressPrefix = '' | 'pa' | 'dp' | 'sp';
export type AddressField = 
  | 'FirstName' 
  | 'LastName' 
  | 'Street' 
  | 'Building' 
  | 'Unit' 
  | 'PostalCode' 
  | 'City' 
  | 'Title'
  | 'Municipality'
  | 'District'
  | 'Province'
  | 'TaxID'
  | 'BusinessName'
  | 'MeterID';

export type AddressSet = {
  [K in AddressField]: string | undefined;
} & {
  [K in AddressField as `pa${K}`]: string | undefined;
} & {
  [K in AddressField as `dp${K}`]: string | undefined;
} & {
  [K in AddressField as `sp${K}`]: string | undefined;
} & {
  ppeNum?: string;
};

export interface PerformanceStats {
  name: string;
  duration: number;
  timestamp: string;
  count?: number;
  totalDuration?: number;
  averageDuration?: number;
  minDuration?: number;
  maxDuration?: number;
  lastDuration?: number;
}
export interface PollOptions {
  intervalInMs?: number;
  abortSignal?: AbortSignalLike;
}

// Stary format danych
export interface LegacyFields {
  // Podstawowe dane faktury
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: string;
  netAmount?: string;
  vatAmount?: string;
  vatRate?: string;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
  invoiceType?: string;
  BilledUsage?: string;
  '12mUsage'?: string;
  BillingStartDate?: string;
  BillingEndDate?: string;
  EnergySaleBreakdown?: any;
  Fortum_zużycie?: any;
  BillBreakdown?: any;
  Unit?: string;

  // Dane punktu poboru
  ppeNum?: string;
  Tariff?: string;
  ReadingType?: string;

  // Dane sprzedawcy
  supplierName?: string;
  OSD_name?: string;
  taxID?: string;
  OSD_region?: string;
  spStreet?: string;
  spBuilding?: string;
  spUnit?: string;
  spPostalCode?: string;
  spCity?: string;
  spProvince?: string;
  spMunicipality?: string;
  spDistrict?: string;
  spTaxID?: string;
  spIBAN?: string;
  spPhoneNum?: string;
  spWebUrl?: string;

  // Dane odbiorcy
  FirstName?: string;
  LastName?: string;
  BusinessName?: string;
  Street?: string;
  Building?: string;
  PostalCode?: string;
  City?: string;
  Province?: string;
  Municipality?: string;
  District?: string;

  // Adres korespondencyjny
  paFirstName?: string;
  paLastName?: string;
  paBusinessName?: string;
  paTitle?: string;
  paStreet?: string;
  paBuilding?: string;
  paUnit?: string;
  paPostalCode?: string;
  paCity?: string;
  paProvince?: string;
  paMunicipality?: string;
  paDistrict?: string;

  // Adres dostawy
  dpFirstName?: string;
  dpLastName?: string;
  dpStreet?: string;
  dpBuilding?: string;
  dpUnit?: string;
  dpPostalCode?: string;
  dpCity?: string;
  dpProvince?: string;
  dpMunicipality?: string;
  dpDistrict?: string;
  dpMeterID?: string;

  // Dane produktu
  ProductName?: string;
  productCode?: string;
}

// Nowy format danych
export interface ModernFields {
  // Podstawowe dane faktury
  InvoiceNumber?: string;
  InvoiceDate?: string;
  DueDate?: string;
  TotalAmount?: string;
  NetAmount?: string;
  VatAmount?: string;
  VatRate?: string;
  Currency?: string;
  InvoiceType: string;
  BillingStartDate?: string;
  BillingEndDate?: string;

  // Dane punktu poboru
  PPENumber?: string;
  MeterID?: string;
  Tariff?: string;
  BilledUsage?: string;
  ConsumptionUnit: string;
  Usage12m?: string;
  ReadingType?: string;
  DeliveryStreet?: string;
  DeliveryBuilding?: string;
  DeliveryUnit?: string;
  DeliveryCity?: string;
  DeliveryPostalCode?: string;
  DeliveryProvince?: string;
  DeliveryMunicipality?: string;
  DeliveryDistrict?: string;

  // Dane sprzedawcy
  SupplierName: string;
  SupplierTaxID?: string;
  SupplierRegion?: string;
  SupplierStreet?: string;
  SupplierBuilding?: string;
  SupplierUnit?: string;
  SupplierCity?: string;
  SupplierPostalCode?: string;
  SupplierProvince?: string;
  SupplierMunicipality?: string;
  SupplierDistrict?: string;
  SupplierIBAN?: string;
  SupplierPhoneNum?: string;
  SupplierWebURL?: string;

  // Dane odbiorcy
  CustomerName: string;
  CustomerTaxId?: string;
  CustomerStreet?: string;
  CustomerBuilding?: string;
  CustomerUnit?: string;
  CustomerCity?: string;
  CustomerPostalCode?: string;
  CustomerProvince?: string;
  CustomerMunicipality?: string;
  CustomerDistrict?: string;

  // Adres korespondencyjny
  PostalName: string;
  PostalTitle?: string;
  PostalStreet?: string;
  PostalBuilding?: string;
  PostalUnit?: string;
  PostalCity?: string;
  PostalPostalCode?: string;
  PostalProvince?: string;
  PostalMunicipality?: string;
  PostalDistrict?: string;

  // Dane produktu
  ProductName?: string;
  ProductCode?: string;

  // Dodatkowe dane
  EnergySaleBreakdown?: any;
  FortumUsage?: any;
  BillBreakdown?: any;
}

// Dodajmy funkcję pomocniczą do transformacji wartości na UPPERCASE
export function toUpperCaseValues<T extends Record<string, string | undefined>>(obj: T): T {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    result[key as keyof T] = value?.toUpperCase() as T[keyof T];
  }
  return result;
}
