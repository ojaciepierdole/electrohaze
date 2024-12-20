import { DocumentField as AzureDocumentField } from '@azure/ai-form-recognizer';

export type FieldType = 
  | 'string'
  | 'number'
  | 'date'
  | 'time'
  | 'phoneNumber'
  | 'address'
  | 'selectionMark'
  | 'countryRegion'
  | 'signature'
  | 'array'
  | 'object'
  | 'currency'
  | 'integer';

export type TransformationType = 'initial' | 'enriched' | 'validated' | 'normalized';
export type DataSource = 'azure' | 'manual' | 'enrichment';

export interface Point {
  x: number;
  y: number;
}

export interface BoundingRegion {
  pageNumber: number;
  polygon: Point[];
}

export interface Span {
  offset: number;
  length: number;
  text: string;
}

export interface FieldMetadata {
  fieldType: FieldType;
  transformationType: TransformationType;
  source: DataSource;
  confidence: number;
  boundingRegions: BoundingRegion[];
  spans: Span[];
}

export interface DocumentField {
  content: string;
  confidence: number;
  boundingBox?: number[];
}

export interface ProcessedDocumentField {
  content: string;
  confidence: number;
  metadata: FieldMetadata;
  value?: string | number | boolean | Date | null;
}

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
  groups: {
    delivery_point: GroupConfidence;
    ppe: GroupConfidence;
    postal_address: GroupConfidence;
    buyer_data: GroupConfidence;
    supplier: GroupConfidence;
    consumption_info: GroupConfidence;
    billing: GroupConfidence;
  };
}

export interface DocumentFieldsMap {
  [key: string]: Record<string, DocumentField>;
}

export interface ProcessingStats {
  averageConfidence: number;
  confidenceRanges: {
    high: number;    // >90%
    medium: number;  // 70-90%
    low: number;     // <70%
  };
  processingTime: number;
  mimeType: string;
  totalFields: number;
}

export interface ProcessingResult {
  sessionId?: string;
  fileName: string;
  modelId: string;
  status?: 'pending' | 'processing' | 'success' | 'error';
  progress?: number;
  error?: string;
  fields?: DocumentFieldsMap;
  timing?: {
    start: number;
    end?: number;
    ocr?: number;
    total?: number;
  };
  confidence?: number;
  documentConfidence?: DocumentConfidence;
  mappedData?: DocumentFieldsMap;
  stats: ProcessingStats;
}

export interface AnalysisField {
  name: string;
  type: FieldType;
  isRequired: boolean;
  description: string;
  group: string;
}

export interface FieldWithConfidence {
  content: string;
  confidence: number;
  metadata: FieldMetadata;
  value?: string | number | boolean | null;
}

export interface DocumentAnalysisResult {
  fields: Record<string, DocumentField>;
  confidence: number;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description?: string;
  version?: string;
}

export interface ProcessingProgress {
  status: 'processing' | 'success' | 'error';
  progress: number;
  totalProgress?: number;
  error?: string;
  results?: ProcessingResult[];
}

export type DocumentStatus = 'processing' | 'success' | 'error';
