import { DocumentField } from '@azure/ai-form-recognizer';
import { Alert } from '@/lib/alert-service';
import { PerformanceStats } from '@/lib/performance-monitor';
import { 
  ISODateString, 
  AddressData, 
  PersonData, 
  BillingPeriod, 
  BaseDataGroup 
} from './common';

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
  content: string | null;
  confidence: number;
  type: string;
  page?: number;
  definition: {
    name: string;
    type: string;
    isRequired: boolean;
    description: string;
    group: FieldGroupKey;
  };
}

export interface PPEData extends AddressData {
  ppeNumber?: string;
  meterNumber?: string;
  tariffGroup?: string;
  contractNumber?: string;
  contractType?: string;
  osdName?: string;
  osdRegion?: string;
}

export interface SupplierData extends AddressData, PersonData {
  supplierName?: string;
  bankAccount?: string;
  bankName?: string;
  email?: string;
  phone?: string;
  website?: string;
  osdName?: string;
  osdRegion?: string;
}

export interface BillingData extends BaseDataGroup {
  billingStartDate?: ISODateString;
  billingEndDate?: ISODateString;
  billedUsage?: number;
  usage12m?: number;
}

export interface DocumentAnalysisResult {
  [key: string]: unknown;
  fileName?: string;
  fileUrl?: string;
  ppeData?: PPEData;
  correspondenceData?: AddressData & PersonData;
  supplierData?: SupplierData;
  billingData?: BillingData;
  customerData?: PersonData;
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

// Typy pomocnicze dla adresów
export type AddressPrefix = '' | 'pa' | 'ppe';
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
  | 'Province';

// Typ dla zestawu adresów
export type AddressSet = {
  [K in AddressField]: string | undefined;
} & {
  [K in AddressField as `pa${K}`]: string | undefined;
} & {
  [K in AddressField as `ppe${K}`]: string | undefined;
};