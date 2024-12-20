import type { 
  DocumentField, 
  FieldType, 
  TransformationType, 
  DataSource, 
  FieldMetadata,
  DocumentFieldsMap 
} from '@/types/processing';

export function convertField(
  content: string | undefined,
  confidence: number,
  fieldType: FieldType = 'string',
  transformationType: TransformationType = 'initial',
  source: DataSource = 'azure'
): DocumentField {
  const metadata: FieldMetadata = {
    fieldType,
    transformationType,
    source,
    confidence,
    boundingRegions: [],
    spans: []
  };

  const safeContent = content || '';
  let value: string | number | boolean | Date | null = safeContent;

  // Konwersja wartości na odpowiedni typ
  switch (fieldType) {
    case 'number':
    case 'currency':
    case 'integer':
      value = Number(safeContent) || 0;
      break;
    case 'date':
      value = safeContent ? new Date(safeContent) : null;
      break;
    case 'selectionMark':
      value = safeContent === 'selected';
      break;
    default:
      value = safeContent;
  }

  return {
    content: safeContent,
    confidence,
    kind: fieldType,
    value,
    metadata
  };
}

export function convertFields(fields: Record<string, any>): DocumentFieldsMap {
  const result: DocumentFieldsMap = {
    delivery_point: {},
    ppe: {},
    postal_address: {},
    buyer_data: {},
    seller_data: {},
    invoice_data: {},
    payment_data: {},
    supplier: {},
    consumption_info: {},
    billing: {}
  };

  for (const [key, field] of Object.entries(fields)) {
    const convertedField = convertField(
      field.content,
      field.confidence || 0,
      field.kind || 'string',
      'initial',
      'azure'
    );

    // Przypisz pole do odpowiedniej grupy
    if (key.startsWith('dp') || key === 'ppeNum' || key === 'meterNumber') {
      result.delivery_point[key] = convertedField;
    } else if (key.startsWith('pa')) {
      result.postal_address[key] = convertedField;
    } else if (key.startsWith('supplier')) {
      result.supplier[key] = convertedField;
    } else if (key.startsWith('billing') || key.includes('invoice')) {
      result.billing[key] = convertedField;
    } else {
      result.buyer_data[key] = convertedField;
    }
  }

  return result;
} 