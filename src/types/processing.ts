import { AbortSignalLike } from '@azure/abort-controller';
import { Alert } from '@/lib/alert-service';

export interface LegacyFields {
  // Dane sprzedawcy
  supplierName?: string;
  OSD_name?: string;
  spTaxID?: string;
  OSD_region?: string;
  spStreet?: string;
  spBuilding?: string;
  spUnit?: string;
  spCity?: string;
  spPostalCode?: string;
  spProvince?: string;
  spMunicipality?: string;
  spDistrict?: string;
  spIBAN?: string;
  spPhoneNum?: string;
  spWebUrl?: string;

  // Dane klienta
  BusinessName?: string;
  FirstName?: string;
  LastName?: string;
  taxID?: string;
  Street?: string;
  Building?: string;
  Unit?: string;
  City?: string;
  PostalCode?: string;
  Province?: string;

  // Adres korespondencyjny
  paBusinessName?: string;
  paFirstName?: string;
  paLastName?: string;
  paTitle?: string;
  paStreet?: string;
  paBuilding?: string;
  paUnit?: string;
  paCity?: string;
  paPostalCode?: string;
  paProvince?: string;
  paMunicipality?: string;
  paDistrict?: string;

  // Miejsce dostawy
  ppeNum?: string;
  dpMeterID?: string;
  dpStreet?: string;
  dpBuilding?: string;
  dpUnit?: string;
  dpCity?: string;
  dpPostalCode?: string;
  dpProvince?: string;
  dpMunicipality?: string;
  dpDistrict?: string;
  Tariff?: string;

  // Dane faktury
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  totalAmount?: string;
  currency?: string;
  invoiceType?: string;
  BillingStartDate?: string;
  BillingEndDate?: string;
  periodStart?: string;
  periodEnd?: string;
  netAmount?: string;
  vatAmount?: string;
  vatRate?: string;

  // Dane zużycia
  BilledUsage?: string;
  '12mUsage'?: string;
  ReadingType?: string;

  // Dane produktu
  ProductName?: string;
  productCode?: string;

  // Dodatkowe dane
  EnergySaleBreakdown?: string;
  'Fortum_zużycie'?: string;
  BillBreakdown?: string;
}

export interface ModernFields {
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

  // Dane klienta
  CustomerName: string;
  CustomerTaxId?: string;
  CustomerStreet?: string;
  CustomerBuilding?: string;
  CustomerUnit?: string;
  CustomerCity?: string;
  CustomerPostalCode?: string;
  CustomerProvince?: string;

  // Adres korespondencyjny
  PostalName?: string;
  PostalTitle?: string;
  PostalStreet?: string;
  PostalBuilding?: string;
  PostalUnit?: string;
  PostalCity?: string;
  PostalPostalCode?: string;
  PostalProvince?: string;
  PostalMunicipality?: string;
  PostalDistrict?: string;

  // Miejsce dostawy
  PPENumber?: string;
  MeterID?: string;
  DeliveryStreet?: string;
  DeliveryBuilding?: string;
  DeliveryUnit?: string;
  DeliveryCity?: string;
  DeliveryPostalCode?: string;
  DeliveryProvince?: string;
  DeliveryMunicipality?: string;
  DeliveryDistrict?: string;
  Tariff?: string;

  // Dane faktury
  InvoiceNumber?: string;
  InvoiceDate?: string;
  DueDate?: string;
  TotalAmount?: string;
  Currency?: string;
  InvoiceType: string;
  BillingStartDate?: string;
  BillingEndDate?: string;
  NetAmount?: string;
  VatAmount?: string;
  VatRate?: string;

  // Dane zużycia
  BilledUsage?: string;
  ConsumptionUnit: string;
  Usage12m?: string;
  ReadingType?: string;

  // Dane produktu
  ProductName?: string;
  ProductCode?: string;

  // Dodatkowe dane
  EnergySaleBreakdown?: string;
  FortumUsage?: string;
  BillBreakdown?: string;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface BoundingRegion {
  pageNumber: number;
  polygon: Point2D[];
}

export interface Span {
  offset: number;
  length: number;
  text?: string;
}

export interface DocumentField {
  content: string;
  confidence: number;
  metadata?: {
    fieldType?: string;
    transformationType?: string;
    source?: string;
    boundingRegions?: BoundingRegion[];
    spans?: Span[];
    [key: string]: unknown;
  };
}

export interface FieldWithConfidence {
  content: string;
  confidence: number;
  metadata?: {
    fieldType?: string;
    transformationType?: string;
    source?: string;
    boundingRegions?: BoundingRegion[];
    spans?: Span[];
    [key: string]: unknown;
  };
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

export interface ModelDefinition {
  id: string;
  name: string;
  description?: string;
  fields?: Array<FieldDefinition>;
  version?: string;
}

export interface FieldDefinition {
  name: string;
  type: string;
  isRequired: boolean;
  description: string;
  group: FieldGroupKey;
}

export interface AnalysisField {
  name: string;
  type: string;
  isRequired: boolean;
  description: string;
  group: FieldGroupKey;
  confidence?: number;
  content?: string;
  metadata?: {
    fieldType?: string;
    transformationType?: string;
    originalValue?: string;
    source?: string;
    boundingRegions?: BoundingRegion[];
    spans?: Array<{
      offset: number;
      length: number;
    }>;
    [key: string]: unknown;
  };
}

export interface ProcessedField extends Omit<AnalysisField, 'group' | 'isRequired'> {
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

export interface BillingData {
  [key: string]: FieldWithConfidence | undefined;
  billingStartDate?: FieldWithConfidence;
  billingEndDate?: FieldWithConfidence;
  billedUsage?: FieldWithConfidence;
  usage12m?: FieldWithConfidence;
}

export interface ProcessingContext {
  ppe?: Partial<PPEData>;
  customer?: Partial<CustomerData>;
  correspondence?: Partial<CorrespondenceData>;
  supplier?: Partial<SupplierData>;
  billing?: Partial<BillingData>;
  metadata?: Record<string, unknown>;
}

export interface ProcessSectionInput {
  section: string;
  fields: Record<string, DocumentField>;
  allFields?: Record<string, DocumentField>;
  metadata?: Record<string, unknown>;
}

export interface ProcessSectionContext {
  ppe?: Record<string, DocumentField>;
  customer?: Record<string, DocumentField>;
  correspondence?: Record<string, DocumentField>;
  supplier?: Record<string, DocumentField>;
  billing?: Record<string, DocumentField>;
  metadata?: Record<string, unknown>;
}

export interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  fields?: Record<string, DocumentField>;
  errors?: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface TextProcessingOptions {
  toUpper?: boolean;
  toLower?: boolean;
  trim?: boolean;
  removeSpaces?: boolean;
  removeSpecialChars?: boolean;
  removeAccents?: boolean;
  removePunctuation?: boolean;
  removeNumbers?: boolean;
  removeLetters?: boolean;
  [key: string]: boolean | undefined;
}

export type AddressPrefix = '' | 'pa' | 'dp' | 'supplier';
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
  [K in AddressField as `supplier${K}`]: string | undefined;
} & {
  ppeNum?: string;
};

export interface BatchProcessingStatus {
  isProcessing: boolean;
  currentFileIndex?: number;
  currentFileName: string | null;
  currentModelIndex?: number;
  currentModelId: string | null;
  fileProgress: number;
  totalProgress: number;
  totalFiles?: number;
  results?: ProcessingResult[];
  error?: string | null;
}

export interface ModelResult {
  modelId: string;
  fields: Record<string, DocumentField>;
  confidence: number;
  pageCount: number;
}

export type ResultField = {
  content: string;
  confidence: number;
  metadata?: {
    fieldType: string;
    transformationType: string;
    source: string;
  };
};

export interface ProcessingResult {
  fileName: string;
  confidence: number;
  modelResults: Array<{
    modelId: string;
    fields: Record<string, DocumentField>;
    confidence: number;
    pageCount: number;
  }>;
  mappedData: DocumentAnalysisResult;
  cacheStats: {
    size: number;
    maxSize: number;
    ttl: number;
  };
  performanceStats: Array<{
    name: string;
    duration: number;
    timestamp: string;
  }>;
  mimeType: string;
  processingTime: number;
  uploadTime: number;
  ocrTime: number;
  analysisTime: number;
  timing?: {
    uploadTime: number;
    ocrTime: number;
    analysisTime: number;
    totalTime: number;
  };
  usability?: boolean;
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

export interface TransformationContext {
  confidence?: number;
  document?: {
    fields: Record<string, DocumentField>;
  };
  field?: DocumentField;
  fieldType?: string;
  metadata?: {
    section?: string;
    fieldName?: string;
    [key: string]: unknown;
  };
}

export interface TransformationResult {
  value: string;
  content: string;
  confidence: number;
  metadata: TransformationMetadata;
  additionalFields?: Record<string, {
    value: string;
    confidence: number;
    metadata?: Partial<TransformationMetadata>;
  }>;
}

export interface TransformationRule {
  name: string;
  description: string;
  priority: number;
  condition?: (value: string, context: TransformationContext) => boolean;
  transform: (value: string, context: TransformationContext) => TransformationResult;
}

export type DocumentData = {
  [section: string]: {
    [field: string]: DocumentField;
  };
};

export interface DocumentAnalysisResult {
  modelId?: string;
  ppe?: Partial<PPEData>;
  customer?: Partial<CustomerData>;
  correspondence?: Partial<CorrespondenceData>;
  supplier?: Partial<SupplierData>;
  billing?: Partial<BillingData>;
  metadata?: Record<string, unknown>;
}

export interface ExtendedDocumentField extends Omit<DocumentField, 'metadata'> {
  name: string;
  type: string;
  isRequired: boolean;
  description: string;
  group: FieldGroupKey;
  confidence: number;
  content: string;
  metadata: {
    fieldType: string;
    transformationType: string;
    originalValue: string;
    source: string;
    boundingRegions?: BoundingRegion[];
    spans?: Span[];
    [key: string]: unknown;
  };
}

export interface MappedDocumentResult {
  success: boolean;
  documentId: string;
  fileName: string;
  fields: Record<string, DocumentField>;
  errors?: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
  modelId?: string;
  status: string;
  createdOn: string;
  lastUpdatedOn: string;
  ppe?: Partial<PPEData>;
  customer?: Partial<CustomerData>;
  correspondence?: Partial<CorrespondenceData>;
  supplier?: Partial<SupplierData>;
  billing?: Partial<BillingData>;
}

export interface TransformationMetadata {
  fieldType: string;
  transformationType: string;
  originalValue?: string;
  source: string;
  status: string;
  boundingRegions?: BoundingRegion[];
  spans?: Array<{
    offset: number;
    length: number;
  }>;
  [key: string]: unknown;
}
