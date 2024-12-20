import { DocumentField as AzureDocumentField } from '@azure/ai-form-recognizer';

export type FieldType = 
  | 'string'
  | 'number'
  | 'date'
  | 'time'
  | 'currency'
  | 'integer'
  | 'array'
  | 'object'
  | 'selectionMark'
  | 'countryRegion'
  | 'phoneNumber'
  | 'address'
  | 'signature';

export type TransformationType = 'initial' | 'enriched' | 'normalized' | 'validated';
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
  boundingRegions: BoundingRegion[];
  spans: Span[];
}

export interface DocumentField {
  content: string;
  confidence: number;
  kind: FieldType;
  value: any;
  metadata: FieldMetadata;
}

export interface ProcessedDocumentField {
  field: AzureDocumentField;
  boundingBox?: number[];
  pageNumber?: number;
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
  timing: {
    upload: number;
    ocr: number;
    analysis: number;
    total: number;
  };
  documentConfidence: DocumentConfidence;
  usability: number;
  status: 'success' | 'error';
  mappedData: DocumentFieldsMap;
}

export interface AnalysisField {
  name: string;
  type: FieldType;
  isRequired: boolean;
  description: string;
  group: string;
}
