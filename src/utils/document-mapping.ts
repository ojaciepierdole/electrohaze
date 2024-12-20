// Funkcja mapująca surowe dane do naszej struktury
import type { DocumentAnalysisResult, FieldWithConfidence, CustomerData, PPEData, CorrespondenceData, SupplierData, BillingData, DocumentField, Point2D, BoundingRegion } from '@/types/processing';
import type { AnalyzeResult, DocumentField as AzureDocumentField, BoundingRegion as AzureBoundingRegion, Point2D as AzurePoint2D } from '@azure/ai-form-recognizer';
import { DateHelpers } from '@/types/common';
import { safeValidateMappedResult } from '@/types/validation';
import { Logger } from '@/lib/logger';
import { formatDate, formatConsumption } from './text-formatting';
import { normalizeAddress } from './data-processing/normalizers/address';
import { determineOSDByPostalCode } from './data-processing/rules/osd';
import { cleanOSDName, cleanOSDRegion } from '@/utils/data-processing/text-formatting';
import { FIELD_NAME_MAP, FIELD_GROUPS } from '@/config/fields';

const logger = Logger.getInstance();

export interface MissingFields {
  readonly customerData: ReadonlyArray<string>;
  readonly ppeData: ReadonlyArray<string>;
  readonly correspondenceData: ReadonlyArray<string>;
  readonly billingData: ReadonlyArray<string>;
  readonly supplierData: ReadonlyArray<string>;
}

const requiredCustomerFields = {
  firstName: 'Imię',
  lastName: 'Nazwisko',
  businessName: 'Nazwa firmy',
  taxId: 'NIP'
} as const;

const requiredPPEFields = {
  ppeNumber: 'Numer PPE',
  tariff: 'Grupa taryfowa'
} as const;

const requiredCorrespondenceFields = {
  street: 'Ulica',
  building: 'Numer budynku',
  postalCode: 'Kod pocztowy',
  city: 'Miasto'
} as const;

const requiredBillingFields = {
  billingStartDate: 'Data początkowa',
  billingEndDate: 'Data końcowa',
  billedUsage: 'Zużycie'
} as const;

const requiredSupplierFields = {
  supplierName: 'Nazwa dostawcy',
  taxId: 'NIP dostawcy'
} as const;

export function findMissingFields(data: DocumentAnalysisResult): MissingFields {
  // Przygotuj tablice dla brakujących pól
  const customerMissing: string[] = [];
  const ppeMissing: string[] = [];
  const correspondenceMissing: string[] = [];
  const billingMissing: string[] = [];
  const supplierMissing: string[] = [];

  // Sprawdzenie pól klienta
  if (data.customer) {
    Object.entries(requiredCustomerFields).forEach(([key, label]) => {
      if (!data.customer?.[key as keyof typeof requiredCustomerFields]) {
        customerMissing.push(label);
      }
    });
  } else {
    customerMissing.push(...Object.values(requiredCustomerFields));
  }

  // Sprawdzenie pól PPE
  if (data.ppe) {
    Object.entries(requiredPPEFields).forEach(([key, label]) => {
      if (!data.ppe?.[key as keyof typeof requiredPPEFields]) {
        ppeMissing.push(label);
      }
    });
  } else {
    ppeMissing.push(...Object.values(requiredPPEFields));
  }

  // Sprawdzenie pól korespondencyjnych
  if (data.correspondence) {
    Object.entries(requiredCorrespondenceFields).forEach(([key, label]) => {
      if (!data.correspondence?.[key as keyof typeof requiredCorrespondenceFields]) {
        correspondenceMissing.push(label);
      }
    });
  } else {
    correspondenceMissing.push(...Object.values(requiredCorrespondenceFields));
  }

  // Sprawdzenie pól rozliczeniowych
  if (data.billing) {
    Object.entries(requiredBillingFields).forEach(([key, label]) => {
      if (!data.billing?.[key as keyof typeof requiredBillingFields]) {
        billingMissing.push(label);
      }
    });
  } else {
    billingMissing.push(...Object.values(requiredBillingFields));
  }

  // Sprawdzenie pól dostawcy
  if (data.supplier) {
    Object.entries(requiredSupplierFields).forEach(([key, label]) => {
      if (!data.supplier?.[key as keyof typeof requiredSupplierFields]) {
        supplierMissing.push(label);
      }
    });
  } else {
    supplierMissing.push(...Object.values(requiredSupplierFields));
  }

  // Zwróć obiekt z niemodyfikowalnymi tablicami
  return {
    customerData: Object.freeze(customerMissing),
    ppeData: Object.freeze(ppeMissing),
    correspondenceData: Object.freeze(correspondenceMissing),
    billingData: Object.freeze(billingMissing),
    supplierData: Object.freeze(supplierMissing)
  } as MissingFields;
}

// Funkcja pomocnicza do bezpiecznego pobierania wartości z DocumentField
function getFieldValue(field: DocumentField | undefined): string | undefined {
  if (!field) return undefined;
  
  // Sprawdzamy typ pola i odpowiednio pobieramy wartość
  if ('valueString' in field && typeof field.valueString === 'string') {
    return field.valueString;
  }
  if ('valuePhoneNumber' in field && typeof field.valuePhoneNumber === 'string') {
    return field.valuePhoneNumber;
  }
  if ('valueTime' in field && typeof field.valueTime === 'string') {
    return field.valueTime;
  }
  if ('valueInteger' in field && typeof field.valueInteger === 'number') {
    return field.valueInteger.toString();
  }
  if ('valueNumber' in field && typeof field.valueNumber === 'number') {
    return field.valueNumber.toString();
  }
  if ('valueDate' in field && typeof field.valueDate === 'string') {
    return field.valueDate;
  }
  if ('valueSelectionMark' in field && typeof field.valueSelectionMark === 'string') {
    return field.valueSelectionMark;
  }
  if ('valueCountryRegion' in field && typeof field.valueCountryRegion === 'string') {
    return field.valueCountryRegion;
  }
  
  // Dla pól tablicowych zwracamy pierwszą wartość lub undefined
  if ('valueArray' in field && Array.isArray(field.valueArray) && field.valueArray.length > 0) {
    const firstValue = field.valueArray[0];
    if (firstValue && typeof firstValue === 'object') {
      return getFieldValue(firstValue);
    }
  }
  
  return undefined;
}

// Funkcja pomocnicza do konwersji wartości na number
function parseNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseFloat(value.replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

// Funkcja pomocnicza do tworzenia FieldWithConfidence
function createFieldWithConfidence(content: string, confidence: number, source: string): FieldWithConfidence {
  return {
    content,
    confidence,
    metadata: {
      fieldType: 'text',
      transformationType: 'initial',
      source
    }
  };
}

// Funkcja pomocnicza do konwersji DocumentField na FieldWithConfidence
function convertToFieldWithConfidence(field: DocumentField | undefined): FieldWithConfidence {
  if (!field) {
    return {
      content: '',
      confidence: 0,
      metadata: {
        fieldType: 'text',
        transformationType: 'initial',
        source: 'empty'
      }
    };
  }

  return {
    content: field.content || '',
    confidence: field.confidence || 0,
    metadata: {
      fieldType: field.metadata?.fieldType || 'text',
      transformationType: field.metadata?.transformationType || 'initial',
      source: field.metadata?.source || 'azure',
      originalValue: field.content
    }
  };
}

function convertAzureFieldToDocumentField(field: AzureDocumentField): DocumentField {
  return {
    content: field.content || '',
    confidence: field.confidence || 0,
    metadata: {
      fieldType: field.kind || 'text',
      transformationType: 'initial',
      source: 'azure',
      boundingRegions: field.boundingRegions?.map((region: AzureBoundingRegion) => ({
        pageNumber: region.pageNumber,
        polygon: region.polygon?.map((point: AzurePoint2D) => ({
          x: point.x,
          y: point.y
        })) || []
      })) || []
    }
  };
}

// Funkcja pomocnicza do mapowania nazwy pola
function mapFieldName(fieldName: string): string {
  return FIELD_NAME_MAP[fieldName as keyof typeof FIELD_NAME_MAP] || fieldName;
}

export function mapDocumentAnalysisResult(fields: Record<string, AzureDocumentField>): DocumentAnalysisResult {
  const result: DocumentAnalysisResult = {
    customer: {},
    ppe: {},
    correspondence: {},
    supplier: {},
    billing: {},
    metadata: {
      technicalData: {
        content: '',
        pages: []
      }
    }
  };

  // Mapowanie pól klienta
  const customerFields = FIELD_GROUPS.buyer_data.fields;
  for (const field of customerFields) {
    const azureField = fields[field] || fields[mapFieldName(field)];
    if (azureField) {
      result.customer![field as keyof CustomerData] = convertToFieldWithConfidence(convertAzureFieldToDocumentField(azureField));
    }
  }

  // Mapowanie pól PPE
  const ppeFields = FIELD_GROUPS.delivery_point.fields;
  for (const field of ppeFields) {
    const azureField = fields[field] || fields[mapFieldName(field)];
    if (azureField) {
      result.ppe![field as keyof PPEData] = convertToFieldWithConfidence(convertAzureFieldToDocumentField(azureField));
    }
  }

  // Mapowanie pól korespondencyjnych
  const correspondenceFields = FIELD_GROUPS.postal_address.fields;
  for (const field of correspondenceFields) {
    const azureField = fields[field] || fields[mapFieldName(field)];
    if (azureField) {
      result.correspondence![field as keyof CorrespondenceData] = convertToFieldWithConfidence(convertAzureFieldToDocumentField(azureField));
    }
  }

  // Mapowanie pól dostawcy
  const supplierFields = FIELD_GROUPS.supplier.fields;
  for (const field of supplierFields) {
    const azureField = fields[field] || fields[mapFieldName(field)];
    if (azureField) {
      result.supplier![field as keyof SupplierData] = convertToFieldWithConfidence(convertAzureFieldToDocumentField(azureField));
    }
  }

  // Mapowanie pól rozliczeniowych
  const billingFields = FIELD_GROUPS.billing.fields;
  for (const field of billingFields) {
    const azureField = fields[field] || fields[mapFieldName(field)];
    if (azureField) {
      result.billing![field as keyof BillingData] = convertToFieldWithConfidence(convertAzureFieldToDocumentField(azureField));
    }
  }

  return result;
}

// Funkcja pomocnicza do ekstrakcji wartości string z DocumentField lub string | DocumentField
function extractStringValue(value: string | DocumentField | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.content || '';
}

// Funkcja pomocnicza do tworzenia pustego wyniku
function createEmptyResult(): DocumentAnalysisResult {
  return {
    customer: {},
    ppe: {},
    correspondence: {},
    supplier: {},
    billing: {},
    metadata: {}
  };
}

// Funkcja pomocnicza do bezpiecznej konwersji pola adresowego
function convertAddressField(
  azureField: AzureDocumentField | undefined,
  normalizedValue: DocumentField | null | undefined,
  defaultContent: string = ''
): DocumentField {
  if (!azureField) {
    return convertAzureFieldToDocumentField({
      content: defaultContent,
      confidence: 0,
      kind: 'string',
      boundingRegions: [],
      spans: []
    } as AzureDocumentField);
  }

  return convertAzureFieldToDocumentField({
    ...azureField,
    content: extractStringValue(normalizedValue) || azureField.content || defaultContent
  });
}

// Funkcja pomocnicza do mapowania odpowiedzi z Azure na nasz format
export function mapAzureResponse(response: AnalyzeResult): DocumentAnalysisResult {
  if (!response.documents || !Array.isArray(response.documents) || response.documents.length === 0) {
    return createEmptyResult();
  }

  const firstDocument = response.documents[0];
  if (!firstDocument || !firstDocument.fields) {
    return createEmptyResult();
  }

  // Normalizuj dane adresowe
  const dpFields = firstDocument.fields;
  const dpAddress = normalizeAddress(
    convertToFieldWithConfidence(convertAzureFieldToDocumentField(dpFields.dpStreet as AzureDocumentField)),
    {},
    'dp'
  );

  // Określ OSD na podstawie kodu pocztowego
  const osdName = determineOSDByPostalCode(dpFields.dpPostalCode?.content);
  const osdConfidence = osdName ? 1.0 : 0;

  // Zachowaj oryginalne wartości dla pól adresowych
  const mappedFields: Record<string, DocumentField> = {
    dpStreet: convertAddressField(dpFields.dpStreet as AzureDocumentField, dpAddress.dpStreet),
    dpBuilding: convertAddressField(dpFields.dpBuilding as AzureDocumentField, dpAddress.dpBuilding),
    dpUnit: convertAddressField(dpFields.dpUnit as AzureDocumentField, dpAddress.dpUnit),
    OSD_name: convertAddressField(undefined, undefined, osdName || '')
  };

  return {
    ...createEmptyResult(),
    metadata: {
      docType: firstDocument.docType || 'unknown',
      confidence: firstDocument.confidence || 0,
      fields: mappedFields
    }
  };
}

export function processSupplierData(data: Partial<SupplierData>): Record<string, FieldWithConfidence | undefined> {
  const processedData: Record<string, FieldWithConfidence | undefined> = {};

  // Przetwórz nazwę OSD
  if (data.OSD_name?.content) {
    processedData.OSD_name = {
      content: cleanOSDName(data.OSD_name.content),
      confidence: data.OSD_name.confidence,
      metadata: {
        fieldType: data.OSD_name.metadata?.fieldType || 'text',
        transformationType: data.OSD_name.metadata?.transformationType || 'initial',
        source: data.OSD_name.metadata?.source || 'raw'
      }
    };
  }

  // Przetwórz region OSD
  if (data.OSD_region?.content) {
    processedData.OSD_region = {
      content: cleanOSDRegion(data.OSD_region.content),
      confidence: data.OSD_region.confidence,
      metadata: {
        fieldType: data.OSD_region.metadata?.fieldType || 'text',
        transformationType: data.OSD_region.metadata?.transformationType || 'initial',
        source: data.OSD_region.metadata?.source || 'raw'
      }
    };
  }

  // Skopiuj pozostałe pola bez zmian
  Object.entries(data).forEach(([key, value]) => {
    if (!['OSD_name', 'OSD_region'].includes(key) && value) {
      processedData[key] = {
        content: value.content,
        confidence: value.confidence,
        metadata: {
          fieldType: value.metadata?.fieldType || 'text',
          transformationType: value.metadata?.transformationType || 'initial',
          source: value.metadata?.source || 'raw'
        }
      };
    }
  });

  return processedData;
}

// Oblicz średnią pewność dla pól z danymi
export function calculateSupplierConfidence(data: Record<string, FieldWithConfidence | undefined>): number {
  const fieldsWithConfidence = Object.values(data)
    .filter((field): field is FieldWithConfidence => field?.confidence !== undefined);
  
  return fieldsWithConfidence.length > 0
    ? fieldsWithConfidence.reduce((acc, field) => acc + field.confidence, 0) / fieldsWithConfidence.length
    : 0;
}

// Oblicz kompletność danych dostawcy
export function calculateSupplierCompleteness(data: Record<string, FieldWithConfidence | undefined>): number {
  const requiredFields = ['supplierName', 'OSD_name', 'OSD_region'];
  const filledRequiredFields = requiredFields.filter(key => data[key]?.content).length;
  return Math.round((filledRequiredFields / requiredFields.length) * 100);
}

function mapField(field: DocumentField): FieldWithConfidence {
  return {
    content: field.content,
    confidence: field.confidence,
    metadata: field.metadata ? {
      fieldType: field.metadata.fieldType || 'text',
      transformationType: field.metadata.transformationType || 'initial',
      source: field.metadata.source || 'raw',
      ...(field.metadata.boundingRegions && { boundingRegions: field.metadata.boundingRegions }),
      ...(field.metadata.spans && { spans: field.metadata.spans })
    } : {
      fieldType: 'text',
      transformationType: 'initial',
      source: 'raw'
    }
  };
}

export function mapDocumentField(field: any): DocumentField {
  return {
    content: field.content || '',
    confidence: field.confidence || 0,
    metadata: {
      fieldType: field.metadata?.fieldType || 'text',
      transformationType: field.metadata?.transformationType || 'initial',
      source: field.metadata?.source || 'raw'
    }
  };
}
  