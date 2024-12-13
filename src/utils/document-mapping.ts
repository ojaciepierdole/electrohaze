// Funkcja mapująca surowe dane do naszej struktury
import type { DocumentAnalysisResult } from '@/types/processing';
import type { DocumentField, DocumentAnalysisResponse } from '@/types/azure';
import { DateHelpers } from '@/types/common';
import { safeValidateMappedResult } from '@/types/validation';
import { Logger } from '@/lib/logger';

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
  tariffGroup: 'Grupa taryfowa'
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
  if (data.customerData) {
    Object.entries(requiredCustomerFields).forEach(([key, label]) => {
      if (!data.customerData?.[key as keyof typeof requiredCustomerFields]) {
        customerMissing.push(label);
      }
    });
  } else {
    customerMissing.push(...Object.values(requiredCustomerFields));
  }

  // Sprawdzenie pól PPE
  if (data.ppeData) {
    Object.entries(requiredPPEFields).forEach(([key, label]) => {
      if (!data.ppeData?.[key as keyof typeof requiredPPEFields]) {
        ppeMissing.push(label);
      }
    });
  } else {
    ppeMissing.push(...Object.values(requiredPPEFields));
  }

  // Sprawdzenie pól korespondencyjnych
  if (data.correspondenceData) {
    Object.entries(requiredCorrespondenceFields).forEach(([key, label]) => {
      if (!data.correspondenceData?.[key as keyof typeof requiredCorrespondenceFields]) {
        correspondenceMissing.push(label);
      }
    });
  } else {
    correspondenceMissing.push(...Object.values(requiredCorrespondenceFields));
  }

  // Sprawdzenie pól rozliczeniowych
  if (data.billingData) {
    Object.entries(requiredBillingFields).forEach(([key, label]) => {
      if (!data.billingData?.[key as keyof typeof requiredBillingFields]) {
        billingMissing.push(label);
      }
    });
  } else {
    billingMissing.push(...Object.values(requiredBillingFields));
  }

  // Sprawdzenie pól dostawcy
  if (data.supplierData) {
    Object.entries(requiredSupplierFields).forEach(([key, label]) => {
      if (!data.supplierData?.[key as keyof typeof requiredSupplierFields]) {
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

export function mapDocumentAnalysisResult(fields: Record<string, DocumentField>): DocumentAnalysisResult {
  // Inicjalizujemy wszystkie możliwe pola jako puste
  const emptyField: FieldWithConfidence = { content: null, confidence: 0 };
  
  const mappedResult: DocumentAnalysisResult = {
    customerData: {
      FirstName: emptyField,
      LastName: emptyField,
      BusinessName: emptyField,
      taxID: emptyField,
      Street: emptyField,
      Building: emptyField,
      Unit: emptyField,
      PostalCode: emptyField,
      City: emptyField,
      Municipality: emptyField,
      District: emptyField,
      Province: emptyField
    },
    ppeData: {
      ppeNum: emptyField,
      MeterNumber: emptyField,
      TariffGroup: emptyField,
      ContractNumber: emptyField,
      ContractType: emptyField,
      OSD_name: emptyField,
      OSD_region: emptyField,
      ProductName: emptyField,
      dpFirstName: emptyField,
      dpLastName: emptyField,
      dpStreet: emptyField,
      dpBuilding: emptyField,
      dpUnit: emptyField,
      dpPostalCode: emptyField,
      dpCity: emptyField
    },
    correspondenceData: {
      paFirstName: emptyField,
      paLastName: emptyField,
      paBusinessName: emptyField,
      paTitle: emptyField,
      paStreet: emptyField,
      paBuilding: emptyField,
      paUnit: emptyField,
      paPostalCode: emptyField,
      paCity: emptyField
    },
    supplierData: {
      supplierName: emptyField,
      supplierTaxID: emptyField,
      supplierStreet: emptyField,
      supplierBuilding: emptyField,
      supplierUnit: emptyField,
      supplierPostalCode: emptyField,
      supplierCity: emptyField,
      supplierBankAccount: emptyField,
      supplierBankName: emptyField,
      supplierEmail: emptyField,
      supplierPhone: emptyField,
      supplierWebsite: emptyField,
      OSD_name: emptyField
    },
    billingData: {
      billingStartDate: emptyField,
      billingEndDate: emptyField,
      billedUsage: emptyField,
      usage12m: emptyField
    }
  };

  // Uzupełniamy wartości z pól rozpoznanych przez Azure
  Object.entries(fields).forEach(([key, field]) => {
    const value = getFieldValue(field);
    if (value !== undefined) {
      // Mapujemy wartość na odpowiednie pole w strukturze
      if (key in mappedResult.customerData) {
        mappedResult.customerData[key as keyof CustomerData] = {
          content: value,
          confidence: field.confidence || 0
        };
      } else if (key in mappedResult.ppeData) {
        mappedResult.ppeData[key as keyof PPEData] = {
          content: value,
          confidence: field.confidence || 0
        };
      } else if (key in mappedResult.correspondenceData) {
        mappedResult.correspondenceData[key as keyof CorrespondenceData] = {
          content: value,
          confidence: field.confidence || 0
        };
      } else if (key in mappedResult.supplierData) {
        mappedResult.supplierData[key as keyof SupplierData] = {
          content: value,
          confidence: field.confidence || 0
        };
      } else if (key in mappedResult.billingData) {
        mappedResult.billingData[key as keyof BillingData] = {
          content: value,
          confidence: field.confidence || 0
        };
      }
    }
  });

  return mappedResult;
}

// Funkcja pomocnicza do mapowania odpowiedzi z Azure na nasz format
export function mapAzureResponse(response: DocumentAnalysisResponse): DocumentAnalysisResult {
  if (!response.documents || response.documents.length === 0) {
    return {};
  }

  return mapDocumentAnalysisResult(response.documents[0].fields);
} 