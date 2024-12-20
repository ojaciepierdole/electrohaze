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

export function mapDocumentFields(fields: Record<string, any>): DocumentFieldsMap {
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

  // Mapowanie pól do odpowiednich grup
  for (const [key, field] of Object.entries(fields)) {
    const convertedField = convertField(
      field.content,
      field.confidence || 0,
      field.kind || 'string',
      'initial',
      'azure'
    );

    // Punkt Poboru Energii
    if (key.startsWith('dp') || 
        key === 'ppeNum' || 
        key === 'meterNumber' || 
        key.includes('tariff') || 
        key.includes('contract') || 
        key === 'osd_name' || 
        key === 'osd_region') {
      result.delivery_point[key] = convertedField;
    }
    // Adres korespondencyjny
    else if (key.startsWith('pa')) {
      result.postal_address[key] = convertedField;
    }
    // Dane sprzedawcy
    else if (key.startsWith('supplier')) {
      result.supplier[key] = convertedField;
    }
    // Dane rozliczeniowe
    else if (key.startsWith('billing') || 
             key.includes('invoice') || 
             key.includes('amount') || 
             key.includes('vat') || 
             key === 'currency') {
      result.billing[key] = convertedField;
    }
    // Informacje o zużyciu
    else if (key.includes('usage') || 
             key.includes('consumption') || 
             key.includes('reading')) {
      result.consumption_info[key] = convertedField;
    }
    // Dane nabywcy
    else {
      result.buyer_data[key] = convertedField;
    }
  }

  return result;
}
  