import type { DocumentField, FieldMetadata, TransformationType, DataSource, FieldType } from '@/types/processing';

export function convertField(
  content: string,
  confidence: number,
  fieldType: FieldType = 'string',
  transformationType: TransformationType = 'initial',
  source: DataSource = 'azure'
): DocumentField {
  const metadata: FieldMetadata = {
    fieldType,
    transformationType,
    source,
    boundingRegions: [],
    spans: [],
    confidence
  };

  let value: string | number | boolean | Date | null = content;

  // Konwersja wartości na odpowiedni typ
  switch (fieldType) {
    case 'number':
    case 'currency':
    case 'integer':
      value = Number(content) || 0;
      break;
    case 'date':
      value = content ? new Date(content) : null;
      break;
    case 'selectionMark':
      value = content === 'selected';
      break;
    default:
      value = content;
  }

  return {
    content,
    confidence,
    kind: fieldType,
    value,
    metadata
  };
}

export function convertAzureFields(fields: Record<string, any>): Record<string, DocumentField> {
  const result: Record<string, DocumentField> = {};

  for (const [key, field] of Object.entries(fields)) {
    result[key] = convertField(
      String(field.content || ''),
      field.confidence || 0,
      field.kind || 'string',
      'initial',
      'azure'
    );
  }

  return result;
} 