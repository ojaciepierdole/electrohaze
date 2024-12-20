import type { 
  DocumentField, 
  FieldType, 
  TransformationType, 
  DataSource, 
  FieldMetadata, 
  ProcessedDocumentField 
} from '@/types/processing';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import { TextProcessor } from './text-processor';

export class DataProcessor {
  private textProcessor: TextProcessor;

  constructor() {
    this.textProcessor = new TextProcessor();
  }

  processField(
    content: unknown,
    confidence: number = 0,
    fieldType: FieldType = 'string',
    metadata: Partial<FieldMetadata> = {}
  ): ProcessedDocumentField {
    const processedValue = this.processValue(content, fieldType);
    return {
      content: String(content),
      confidence,
      value: processedValue,
      metadata: {
        fieldType,
        transformationType: 'initial' as TransformationType,
        source: 'azure' as DataSource,
        confidence: metadata.confidence ?? confidence,
        boundingRegions: metadata.boundingRegions ?? [],
        spans: metadata.spans ?? [],
        ...metadata
      }
    };
  }

  private processValue(value: unknown, fieldType: FieldType): string | number | boolean | Date | null {
    if (value === null || value === undefined) return null;
    
    switch (fieldType) {
      case 'number':
      case 'integer':
      case 'currency':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'date':
        const date = new Date(String(value));
        return isNaN(date.getTime()) ? null : date;
      case 'selectionMark':
        return Boolean(value);
      default:
        return String(value);
    }
  }

  processPPEData(data: Partial<PPEData>): Record<string, DocumentField> {
    const result: Record<string, DocumentField> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = this.processField(value);
      }
    }

    return result;
  }

  processCustomerData(data: Partial<CustomerData>): Record<string, DocumentField> {
    const result: Record<string, DocumentField> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = this.processField(value);
      }
    }

    return result;
  }

  processCorrespondenceData(data: Partial<CorrespondenceData>): Record<string, DocumentField> {
    const result: Record<string, DocumentField> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = this.processField(value);
      }
    }

    return result;
  }

  processSupplierData(data: Partial<SupplierData>): Record<string, DocumentField> {
    const result: Record<string, DocumentField> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = this.processField(value);
      }
    }

    return result;
  }

  processBillingData(data: Partial<BillingData>): Record<string, DocumentField> {
    const result: Record<string, DocumentField> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        result[key] = this.processField(value);
      }
    }

    return result;
  }
} 