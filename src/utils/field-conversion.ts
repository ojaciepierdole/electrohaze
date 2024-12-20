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
  const metadata: FieldMetadata = {
    fieldType: kind,
    transformationType: 'initial',
    source: 'azure',
    boundingRegions: [],
    spans: []
  };

  const result: DocumentField = {
    content: '',
    confidence: 0,
    kind,
    value: null,
    metadata
  };

  if ('content' in field) {
    result.content = String(field.content || '');
  }

  if ('confidence' in field) {
    result.confidence = Number(field.confidence || 0);
  }

  if ('boundingRegions' in field && Array.isArray(field.boundingRegions)) {
    metadata.boundingRegions = field.boundingRegions.map(region => ({
      pageNumber: region.pageNumber,
      polygon: Array.isArray(region.polygon) 
        ? region.polygon.map(point => ({ x: point.x, y: point.y }))
        : []
    }));
  }

  if ('spans' in field && Array.isArray(field.spans)) {
    metadata.spans = field.spans.map(span => ({
      offset: span.offset,
      length: span.length,
      text: ''
    }));
  }

  if ('content' in field) {
    const content = field.content || '';
    
    switch (kind) {
      case 'number':
      case 'currency':
      case 'integer':
        result.value = Number(content);
        break;
      case 'date':
        result.value = content ? new Date(content) : null;
        break;
      case 'object':
        try {
          result.value = content ? JSON.parse(content) : {};
        } catch {
          result.value = {};
        }
        break;
      case 'array':
        try {
          result.value = content ? JSON.parse(content) : [];
        } catch {
          result.value = [];
        }
        break;
      case 'selectionMark':
        result.value = content === 'selected';
        break;
      default:
        result.value = content;
    }
  }

  return result;
}

export function convertFieldWithMetadata(value: FieldWithMetadata): DocumentField {
  const kind = value.metadata?.fieldType || 'string';
  const field: DocumentField = {
    content: value.content || '',
    confidence: value.confidence || 0,
    kind,
    value: null,
    metadata: {
      fieldType: kind,
      transformationType: value.metadata?.transformationType || 'initial',
      source: value.metadata?.source || 'manual',
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