import type { 
  DocumentField,
  FieldType,
  TransformationType,
  DataSource,
  FieldMetadata
} from '@/types/processing';
import type { DocumentField as AzureDocumentField } from '@azure/ai-form-recognizer';

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

export function convertAzureFieldToDocumentField(field: AzureDocumentField): DocumentField {
  const kind = 'string' as FieldType;
  const confidence = field.confidence ?? 0;
  
  const metadata: FieldMetadata = {
    fieldType: kind,
    transformationType: 'initial',
    source: 'azure',
    confidence,
    boundingRegions: (field.boundingRegions ?? []).map(region => ({
      pageNumber: region.pageNumber,
      polygon: region.polygon?.map(point => ({ x: point.x, y: point.y })) ?? []
    })),
    spans: (field.spans ?? []).map(span => ({
      offset: span.offset,
      length: span.length,
      text: String(field.content ?? '')
    }))
  };

  return {
    content: field.content ?? '',
    confidence,
    kind,
    value: field.content ?? null,
    metadata
  };
}

export function convertAzureFieldWithMetadata(
  field: AzureDocumentField, 
  metadata: Partial<FieldMetadata>
): DocumentField {
  const confidence = field.confidence ?? 0;
  
  const boundingRegions = metadata.boundingRegions?.map(region => ({
    pageNumber: region.pageNumber,
    polygon: region.polygon.map(point => ({ x: point.x, y: point.y }))
  })) ?? [];

  const spans = metadata.spans?.map(span => ({
    offset: span.offset,
    length: span.length,
    text: span.text
  })) ?? [];

  return {
    content: field.content ?? '',
    confidence,
    kind: metadata.fieldType ?? 'string',
    value: field.content ?? null,
    metadata: {
      fieldType: metadata.fieldType ?? 'string',
      transformationType: metadata.transformationType ?? 'initial',
      source: metadata.source ?? 'azure',
      confidence,
      boundingRegions,
      spans
    }
  };
}

export function convertFieldWithMetadata(value: FieldWithMetadata): DocumentField {
  const kind = value.metadata?.fieldType || 'string';
  const confidence = value.confidence || 0;
  const field: DocumentField = {
    content: value.content || '',
    confidence,
    kind,
    value: null,
    metadata: {
      fieldType: kind,
      transformationType: value.metadata?.transformationType || 'initial',
      source: value.metadata?.source || 'manual',
      confidence,
      boundingRegions: value.metadata?.boundingRegions?.map(region => ({
        pageNumber: region.pageNumber,
        polygon: region.polygon?.map(point => ({ x: point.x, y: point.y })) || []
      })) || [],
      spans: value.metadata?.spans?.map(span => ({
        offset: span.offset,
        length: span.length,
        text: span.text || ''
      })) || []
    }
  };

  switch (kind) {
    case 'number':
    case 'currency':
    case 'integer':
      field.value = Number(value.content || 0);
      break;
    case 'date':
      field.value = value.content ? new Date(value.content) : null;
      break;
    case 'object':
      field.value = value.content ? JSON.parse(value.content) : {};
      break;
    case 'array':
      field.value = value.content ? JSON.parse(value.content) : [];
      break;
    case 'selectionMark':
      field.value = value.content === 'selected';
      break;
    default:
      field.value = value.content || '';
  }

  return field;
} 