import type { 
  DocumentField as AzureDocumentField,
  DocumentStringField,
  DocumentNumberField,
  DocumentDateField,
  DocumentTimeField,
  DocumentPhoneNumberField,
  DocumentAddressField,
  DocumentSelectionMarkField,
  DocumentCountryRegionField,
  DocumentSignatureField,
  DocumentArrayField,
  DocumentObjectField
} from '@azure/ai-form-recognizer';
import type { DocumentAnalysisResult, DocumentField as ProcessedDocumentField, FieldType } from '@/types/processing';
import { determineFieldGroup } from '@/utils/field-grouping';

interface MappedFields {
  [key: string]: ProcessedDocumentField;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: (value: string) => string;
}

const fieldMappings: FieldMapping[] = [
  // PPE
  { sourceField: 'PPENumber', targetField: 'ppeNum' },
  { sourceField: 'MeterNumber', targetField: 'MeterNumber' },
  { sourceField: 'TariffGroup', targetField: 'TariffGroup' },
  
  // Adres PPE
  { sourceField: 'DeliveryStreet', targetField: 'dpStreet' },
  { sourceField: 'DeliveryBuilding', targetField: 'dpBuilding' },
  { sourceField: 'DeliveryUnit', targetField: 'dpUnit' },
  { sourceField: 'DeliveryPostalCode', targetField: 'dpPostalCode' },
  { sourceField: 'DeliveryCity', targetField: 'dpCity' },
  { sourceField: 'DeliveryMunicipality', targetField: 'dpMunicipality' },
  { sourceField: 'DeliveryDistrict', targetField: 'dpDistrict' },
  { sourceField: 'DeliveryProvince', targetField: 'dpProvince' },
  
  // Dane klienta
  { sourceField: 'FirstName', targetField: 'FirstName' },
  { sourceField: 'LastName', targetField: 'LastName' },
  { sourceField: 'BusinessName', targetField: 'BusinessName' },
  { sourceField: 'TaxID', targetField: 'taxID' },
  
  // Adres klienta
  { sourceField: 'Street', targetField: 'Street' },
  { sourceField: 'Building', targetField: 'Building' },
  { sourceField: 'Unit', targetField: 'Unit' },
  { sourceField: 'PostalCode', targetField: 'PostalCode' },
  { sourceField: 'City', targetField: 'City' },
  { sourceField: 'Municipality', targetField: 'Municipality' },
  { sourceField: 'District', targetField: 'District' },
  { sourceField: 'Province', targetField: 'Province' },
  
  // Adres korespondencyjny
  { sourceField: 'PostalFirstName', targetField: 'paFirstName' },
  { sourceField: 'PostalLastName', targetField: 'paLastName' },
  { sourceField: 'PostalBusinessName', targetField: 'paBusinessName' },
  { sourceField: 'PostalStreet', targetField: 'paStreet' },
  { sourceField: 'PostalBuilding', targetField: 'paBuilding' },
  { sourceField: 'PostalUnit', targetField: 'paUnit' },
  { sourceField: 'PostalPostalCode', targetField: 'paPostalCode' },
  { sourceField: 'PostalCity', targetField: 'paCity' },
  { sourceField: 'PostalMunicipality', targetField: 'paMunicipality' },
  { sourceField: 'PostalDistrict', targetField: 'paDistrict' },
  { sourceField: 'PostalProvince', targetField: 'paProvince' },
  
  // Dostawca
  { sourceField: 'SupplierName', targetField: 'supplierName' },
  { sourceField: 'SupplierTaxID', targetField: 'supplierTaxID' },
  { sourceField: 'SupplierStreet', targetField: 'supplierStreet' },
  { sourceField: 'SupplierBuilding', targetField: 'supplierBuilding' },
  { sourceField: 'SupplierUnit', targetField: 'supplierUnit' },
  { sourceField: 'SupplierPostalCode', targetField: 'supplierPostalCode' },
  { sourceField: 'SupplierCity', targetField: 'supplierCity' },
  { sourceField: 'SupplierBankAccount', targetField: 'supplierBankAccount' },
  { sourceField: 'SupplierBankName', targetField: 'supplierBankName' },
  { sourceField: 'SupplierEmail', targetField: 'supplierEmail' },
  { sourceField: 'SupplierPhone', targetField: 'supplierPhone' },
  { sourceField: 'SupplierWebsite', targetField: 'supplierWebsite' },
  
  // OSD
  { sourceField: 'OSDName', targetField: 'OSD_name' },
  { sourceField: 'OSDRegion', targetField: 'OSD_region' },
  
  // Rozliczenia
  { sourceField: 'BillingStartDate', targetField: 'billingStartDate' },
  { sourceField: 'BillingEndDate', targetField: 'billingEndDate' },
  { sourceField: 'BilledUsage', targetField: 'billedUsage' },
  { sourceField: 'Usage12m', targetField: 'usage12m' }
];

// Konwertuje pole dokumentu z formatu Azure na nasz format
function convertField(field: AzureDocumentField): ProcessedDocumentField {
  let content = '';
  let confidence = 0;
  let kind: FieldType = 'string';
  let value: unknown = null;

  if ('content' in field) {
    content = field.content || '';
  }

  if ('confidence' in field) {
    confidence = field.confidence || 0;
  }

  if ('kind' in field) {
    kind = field.kind as FieldType;
  }

  if ('value' in field) {
    value = field.value;
  }

  return {
    content,
    confidence,
    kind,
    value,
    metadata: {
      fieldType: kind,
      transformationType: 'initial',
      source: 'azure',
      boundingRegions: 'boundingRegions' in field ? field.boundingRegions?.map(region => ({
        pageNumber: region.pageNumber,
        polygon: region.polygon?.map(point => ({ x: point.x, y: point.y })) || []
      })) || [] : [],
      spans: 'spans' in field ? field.spans?.map(span => ({
        offset: span.offset,
        length: span.length,
        text: typeof span === 'object' && span !== null && 'content' in span ? String(span.content || '') : ''
      })) || [] : []
    }
  };
}

// Mapuje pola z formatu Azure na nasz format
export function mapDocumentFields(analysisResult: DocumentAnalysisResult): MappedFields {
  const mappedFields: MappedFields = {};

  // Mapuj pola według zdefiniowanych mapowań
  for (const mapping of fieldMappings) {
    const sourceField = analysisResult.fields[mapping.sourceField] as AzureDocumentField;
    if (sourceField) {
      mappedFields[mapping.targetField] = convertField(sourceField);
    }
  }

  // Mapuj pozostałe pola, które nie mają zdefiniowanego mapowania
  for (const [fieldName, field] of Object.entries(analysisResult.fields)) {
    if (!fieldMappings.some(mapping => mapping.sourceField === fieldName)) {
      const targetFieldName = fieldName;
      mappedFields[targetFieldName] = convertField(field as AzureDocumentField);
    }
  }

  return mappedFields;
}

// Grupuje zmapowane pola według ich grup
export function groupMappedFields(mappedFields: MappedFields): Record<string, MappedFields> {
  const groupedFields: Record<string, MappedFields> = {};

  for (const [fieldName, field] of Object.entries(mappedFields)) {
    const group = determineFieldGroup(fieldName);
    if (!groupedFields[group]) {
      groupedFields[group] = {};
    }
    groupedFields[group][fieldName] = field;
  }

  return groupedFields;
}
  