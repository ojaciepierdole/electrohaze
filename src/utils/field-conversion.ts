import { 
  type FieldType, 
  type DocumentField, 
  type ProcessedDocumentField,
  type FieldMetadata,
  type TransformationType,
  type DataSource
} from '@/types/processing';
import type { AzureDocumentField } from '@/types/azure';

interface FieldWithMetadata {
  content: string;
  confidence: number;
  metadata?: {
    fieldType?: FieldType;
    transformationType?: TransformationType;
    source?: DataSource;
    boundingRegions?: Array<{
      pageNumber: number;
      polygon: Array<{ x: number; y: number }>;
    }>;
    spans?: Array<{
      offset: number;
      length: number;
      text?: string;
    }>;
  };
}

export function convertAzureFieldToDocumentField(field: AzureDocumentField): ProcessedDocumentField {
  const fieldType = 'string' as FieldType;
  const confidence = field.confidence ?? 0;
  const metadata: FieldMetadata = {
    fieldType,
    transformationType: 'initial',
    source: 'azure',
    confidence,
    boundingRegions: field.boundingRegions?.map(region => ({
      pageNumber: region.pageNumber,
      polygon: region.boundingBox.map((value, index) => ({
        x: index % 2 === 0 ? value : 0,
        y: index % 2 === 1 ? value : 0
      })).filter((_, index) => index < 8)
    })) ?? [],
    spans: [{
      offset: 0,
      length: field.content?.length ?? 0,
      text: field.content ?? ''
    }]
  };

  return {
    content: field.content ?? '',
    confidence,
    value: field.content ?? null,
    metadata
  };
}

export function convertAzureFieldWithMetadata(
  field: AzureDocumentField, 
  metadata: Partial<FieldMetadata>
): ProcessedDocumentField {
  const confidence = field.confidence ?? 0;
  const fullMetadata: FieldMetadata = {
    fieldType: metadata.fieldType ?? 'string',
    transformationType: metadata.transformationType ?? 'initial',
    source: metadata.source ?? 'azure',
    confidence,
    boundingRegions: field.boundingRegions?.map(region => ({
      pageNumber: region.pageNumber,
      polygon: region.boundingBox.map((value, index) => ({
        x: index % 2 === 0 ? value : 0,
        y: index % 2 === 1 ? value : 0
      })).filter((_, index) => index < 8)
    })) ?? [],
    spans: [{
      offset: 0,
      length: field.content?.length ?? 0,
      text: field.content ?? ''
    }]
  };

  return {
    content: field.content ?? '',
    confidence,
    value: field.content ?? null,
    metadata: fullMetadata
  };
}

export function convertFieldWithMetadata(value: FieldWithMetadata): ProcessedDocumentField {
  const fieldType = value.metadata?.fieldType || 'string';
  const confidence = value.confidence || 0;
  const metadata: FieldMetadata = {
    fieldType,
    transformationType: value.metadata?.transformationType ?? 'initial',
    source: value.metadata?.source ?? 'manual',
    confidence,
    boundingRegions: value.metadata?.boundingRegions ?? [],
    spans: value.metadata?.spans?.map(span => ({
      offset: span.offset,
      length: span.length,
      text: span.text ?? ''
    })) ?? []
  };

  return {
    content: value.content || '',
    confidence,
    value: value.content || null,
    metadata
  };
} 