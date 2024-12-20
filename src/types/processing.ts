import type { DocumentField as AzureDocumentField } from '@azure/ai-form-recognizer';
import type { FieldGroupKey } from './fields';
import type { AbortSignalLike } from '@azure/abort-controller';

export type FieldType = 
  | 'string'
  | 'number'
  | 'date'
  | 'time'
  | 'phoneNumber'
  | 'object'
  | 'array'
  | 'currency'
  | 'address'
  | 'integer'
  | 'selectionMark'
  | 'countryRegion'
  | 'signature';

export type TransformationType = 'initial' | 'enriched' | 'normalized';
export type DataSource = 'azure' | 'enrichment' | 'manual';
export type DocumentStatus = 'success' | 'error' | 'processing';

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

export interface FieldMetadata {
  fieldType: FieldType;
  transformationType: TransformationType;
  source: DataSource;
  boundingRegions?: BoundingRegion[];
  spans?: Span[];
}

export interface DocumentField {
  content: string;
  confidence: number;
  kind: FieldType;
  value: unknown;
  metadata?: FieldMetadata;
}

export type FieldWithConfidence = DocumentField;

export interface GroupConfidence {
  completeness: number;
  confidence: number;
  filledRequired: number;
  totalRequired: number;
  filledOptional: number;
  totalOptional: number;
}

export interface DocumentConfidence {
  overall: number;
  confidence: number;
  groups: Record<FieldGroupKey, GroupConfidence>;
}

export interface ProcessingTiming {
  upload: number;
  ocr: number;
  analysis: number;
  total: number;
}

export interface DocumentFieldsMap {
  delivery_point: Record<string, DocumentField>;
  ppe: Record<string, DocumentField>;
  postal_address: Record<string, DocumentField>;
  buyer_data: Record<string, DocumentField>;
  supplier: Record<string, DocumentField>;
  consumption_info: Record<string, DocumentField>;
  billing: Record<string, DocumentField>;
}

export interface ProcessingResult {
  fileName: string;
  timing: ProcessingTiming;
  documentConfidence: DocumentConfidence;
  usability: number;
  status: DocumentStatus;
  error?: string;
  mappedData: DocumentFieldsMap;
}

export interface FieldDefinition {
  name: string;
  type: string;
  isRequired: boolean;
  description: string;
  group: FieldGroupKey;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description?: string;
  fields: FieldDefinition[];
  version: string;
  isCustom: boolean;
  status: string;
}

export interface FieldGroup {
  name: FieldGroupKey;
  label: string;
  icon: string;
  fields: string[];
  requiredFields: string[];
}

export interface BatchProcessingStatus {
  isProcessing: boolean;
  currentFileName: string | null;
  currentModelId: string | null;
  currentFileIndex?: number;
  currentModelIndex?: number;
  fileProgress: number;
  totalProgress: number;
  error: string | null;
  results: ProcessingResult[];
  totalFiles?: number;
}

export interface PollOptions {
  intervalInMs: number;
  abortSignal?: AbortSignalLike;
}

export interface AnalysisField {
  name: string;
  type: FieldType;
  isRequired: boolean;
  description: string;
  group: FieldGroupKey;
}

export interface DocumentAnalysisResult {
  fields: Record<string, DocumentField>;
  tables: unknown[];
  styles: unknown[];
  pages: unknown[];
  languages: string[];
}
