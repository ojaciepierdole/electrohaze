import { TextProcessor } from './text-processor';
import type { DocumentField, TransformationResult } from '@/types/document';
import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';

/**
 * Typy sekcji dokumentu
 */
type DocumentSection = 'ppe' | 'customer' | 'correspondence' | 'supplier' | 'billing';

/**
 * Typy pól dokumentu
 */
type FieldType = 
  | 'text' 
  | 'name' 
  | 'address' 
  | 'postal_code'
  | 'number'
  | 'date'
  | 'amount'
  | 'phone'
  | 'email'
  | 'tax_id'
  | 'bank_account';

/**
 * Typy formatowania
 */
type FormatType = 
  | 'text'
  | 'name'
  | 'address'
  | 'number'
  | 'title'
  | 'date'
  | 'amount';

/**
 * Konfiguracja pola
 */
interface FieldConfig {
  type: FieldType;
  required?: boolean;
  dependsOn?: string[];
  transform?: (value: string, context: TransformationContext) => string;
}

/**
 * Kontekst transformacji
 */
interface TransformationContext {
  section: DocumentSection;
  field: string;
  value: string;
  document: Record<string, DocumentField>;
}

/**
 * Konfiguracja pól dla każdej sekcji
 */
const FIELD_CONFIG: Record<DocumentSection, Record<string, FieldConfig>> = {
  ppe: {
    ppeNum: { type: 'text', required: true },
    MeterNumber: { type: 'text', required: true },
    TariffGroup: { type: 'text', required: true },
    dpStreet: { type: 'address' },
    dpBuilding: { type: 'text' },
    dpPostalCode: { type: 'postal_code' },
    dpCity: { type: 'text' }
  },
  customer: {
    FirstName: { type: 'name' },
    LastName: { type: 'name' },
    BusinessName: { type: 'text' },
    taxID: { type: 'tax_id' },
    Street: { type: 'address' },
    Building: { type: 'text' },
    PostalCode: { type: 'postal_code' },
    City: { type: 'text' }
  },
  correspondence: {
    paFirstName: { type: 'name' },
    paLastName: { type: 'name' },
    paBusinessName: { type: 'text' },
    paStreet: { type: 'address' },
    paBuilding: { type: 'text' },
    paPostalCode: { type: 'postal_code' },
    paCity: { type: 'text' }
  },
  supplier: {
    supplierName: { type: 'text', required: true },
    supplierTaxID: { type: 'tax_id', required: true },
    supplierStreet: { type: 'address' },
    supplierBuilding: { type: 'text' },
    supplierPostalCode: { type: 'postal_code' },
    supplierCity: { type: 'text' },
    supplierBankAccount: { type: 'bank_account' },
    supplierEmail: { type: 'email' },
    supplierPhone: { type: 'phone' },
    OSD_name: { type: 'text' },
    OSD_region: { type: 'text' }
  },
  billing: {
    billingStartDate: { type: 'date' },
    billingEndDate: { type: 'date' },
    billedUsage: { type: 'amount' },
    '12mUsage': { type: 'amount' }
  }
};

/**
 * Klasa do przetwarzania danych dokumentu
 */
export class DataProcessor {
  /**
   * Przetwarza pojedyncze pole
   */
  private static processField(
    value: string | null,
    config: FieldConfig,
    context: TransformationContext
  ): TransformationResult {
    if (!value) {
      return {
        value: '',
        confidence: 0,
        metadata: {
          fieldType: config.type,
          transformationType: 'empty'
        }
      };
    }

    let processedValue = value;

    // Zastosuj transformację specyficzną dla typu pola
    switch (config.type) {
      case 'name':
        processedValue = TextProcessor.format(value, 'name');
        break;

      case 'address':
        processedValue = TextProcessor.format(value, 'address');
        break;

      case 'postal_code':
        processedValue = TextProcessor.formatPostalCode(value);
        break;

      case 'number':
        processedValue = TextProcessor.format(value, 'number');
        break;

      case 'date':
        processedValue = TextProcessor.formatDate(value);
        break;

      case 'amount':
        processedValue = TextProcessor.formatAmount(value);
        break;

      case 'phone':
        processedValue = TextProcessor.format(value, 'number')
          .replace(/[^\d]/g, '');
        break;

      case 'email':
        processedValue = TextProcessor.format(value, 'text')
          .toLowerCase();
        break;

      case 'tax_id':
        processedValue = TextProcessor.format(value, 'number')
          .replace(/[^\d]/g, '');
        break;

      case 'bank_account':
        processedValue = TextProcessor.format(value, 'number')
          .replace(/[^\d]/g, '');
        break;

      default:
        processedValue = TextProcessor.format(value, 'text');
    }

    // Zastosuj dodatkową transformację jeśli jest zdefiniowana
    if (config.transform) {
      processedValue = config.transform(processedValue, context);
    }

    return {
      value: processedValue,
      confidence: value === processedValue ? 1 : 0.8,
      metadata: {
        fieldType: config.type,
        transformationType: 'processed',
        originalValue: value
      }
    };
  }

  /**
   * Przetwarza sekcję dokumentu
   */
  private static processSection(
    section: DocumentSection,
    data: Record<string, DocumentField>
  ): Record<string, DocumentField> {
    const result: Record<string, DocumentField> = {};
    const config = FIELD_CONFIG[section];

    // Przygotuj kontekst transformacji
    const context: TransformationContext = {
      section,
      field: '',
      value: '',
      document: data
    };

    // Przetwórz każde pole w sekcji
    for (const [field, fieldConfig] of Object.entries(config)) {
      const fieldData = data[field];
      
      if (!fieldData && fieldConfig.required) {
        result[field] = {
          content: '',
          confidence: 0,
          metadata: {
            fieldType: fieldConfig.type,
            transformationType: 'missing_required'
          }
        };
        continue;
      }

      if (!fieldData) {
        continue;
      }

      // Zaktualizuj kontekst
      context.field = field;
      context.value = fieldData.content;

      // Przetwórz pole
      const processed = this.processField(
        fieldData.content,
        fieldConfig,
        context
      );

      result[field] = {
        content: processed.value,
        confidence: processed.confidence,
        metadata: {
          ...fieldData.metadata,
          ...processed.metadata
        }
      };
    }

    return result;
  }

  /**
   * Przetwarza cały dokument
   */
  static processDocument(data: Record<string, Record<string, DocumentField>>): Record<string, Record<string, DocumentField>> {
    const result: Record<string, Record<string, DocumentField>> = {};

    // Przetwórz każdą sekcję
    for (const section of Object.keys(FIELD_CONFIG) as DocumentSection[]) {
      const sectionData = data[section];
      if (!sectionData) continue;

      result[section] = this.processSection(section, sectionData);
    }

    return result;
  }
} 