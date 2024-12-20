import type { 
  DocumentField, 
  FieldType, 
  TransformationType, 
  DataSource, 
  FieldMetadata 
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
  ): DocumentField {
    return {
      content: String(content),
      confidence,
      kind: fieldType,
      value: content,
      metadata: {
        fieldType,
        transformationType: 'initial' as TransformationType,
        source: 'azure' as DataSource,
        boundingRegions: [],
        spans: [],
        ...metadata
      }
    };
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