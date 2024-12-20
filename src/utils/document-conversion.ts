import type { DocumentField, FieldMetadata, TransformationType, DataSource, FieldType } from '@/types/processing';
import type { AnalyzeResult } from '@azure/ai-form-recognizer';

function determineFieldType(field: any): FieldType {
  if (typeof field === 'number' || field?.kind === 'number') return 'number';
  if (field?.kind === 'date') return 'date';
  if (field?.kind === 'time') return 'time';
  if (field?.kind === 'phoneNumber') return 'phoneNumber';
  if (field?.kind === 'currency') return 'currency';
  if (field?.kind === 'address') return 'address';
  if (field?.kind === 'integer') return 'integer';
  if (field?.kind === 'selectionMark') return 'selectionMark';
  if (field?.kind === 'countryRegion') return 'countryRegion';
  if (field?.kind === 'signature') return 'signature';
  return 'string';
}

export function convertAzureField(field: any): DocumentField {
  const fieldType = determineFieldType(field);
  const metadata: FieldMetadata = {
    fieldType,
    transformationType: 'initial',
    source: 'azure',
    boundingRegions: [],
    spans: []
  };

  let value: unknown = field.content;
  if (fieldType === 'number' || fieldType === 'currency' || fieldType === 'integer') {
    value = Number(field.content) || 0;
  } else {
    value = String(field.content || '');
  }

  return {
    content: String(field.content || ''),
    confidence: field.confidence || 0,
    kind: fieldType,
    value,
    metadata
  };
}

export function convertAzureFields(fields: Record<string, any>): Record<string, DocumentField> {
  const result: Record<string, DocumentField> = {};

  for (const [key, field] of Object.entries(fields)) {
    result[key] = convertAzureField(field);
  }

  return result;
} 