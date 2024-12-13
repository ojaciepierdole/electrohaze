// Funkcja mapująca surowe dane do naszej struktury
import type { DocumentAnalysisResult } from '@/types/processing';
import type { DocumentField } from '@azure/ai-form-recognizer';
import { DateHelpers } from '@/types/common';
import { safeValidateDocumentAnalysisResult } from '@/types/validation';
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
  const mappedResult: DocumentAnalysisResult = {
    ppeData: {
      ppeNumber: getFieldValue(fields.ppeNum),
      meterNumber: getFieldValue(fields.MeterNumber),
      tariffGroup: getFieldValue(fields.Tariff),
      contractNumber: getFieldValue(fields.ContractNumber),
      contractType: getFieldValue(fields.ContractType),
      street: getFieldValue(fields.dpStreet),
      building: getFieldValue(fields.dpBuilding),
      unit: getFieldValue(fields.dpUnit),
      city: getFieldValue(fields.dpCity)?.replace(',', ''),
      osdName: getFieldValue(fields.OSD_name),
      osdRegion: getFieldValue(fields.OSD_region)
    },
    correspondenceData: {
      firstName: getFieldValue(fields.paFirstName),
      lastName: getFieldValue(fields.paLastName),
      businessName: getFieldValue(fields.paBusinessName),
      title: getFieldValue(fields.paTitle),
      street: getFieldValue(fields.paStreet),
      building: getFieldValue(fields.paBuilding),
      unit: getFieldValue(fields.paUnit),
      postalCode: getFieldValue(fields.paPostalCode),
      city: getFieldValue(fields.paCity)
    },
    supplierData: {
      supplierName: getFieldValue(fields.supplierName),
      taxId: getFieldValue(fields.taxID),
      street: getFieldValue(fields.supplierStreet),
      building: getFieldValue(fields.supplierBuilding),
      unit: getFieldValue(fields.supplierUnit),
      postalCode: getFieldValue(fields.supplierPostalCode),
      city: getFieldValue(fields.supplierCity),
      bankAccount: getFieldValue(fields.supplierBankAccount),
      bankName: getFieldValue(fields.supplierBankName),
      email: getFieldValue(fields.supplierEmail),
      phone: getFieldValue(fields.supplierPhone),
      website: getFieldValue(fields.supplierWebsite),
      osdName: getFieldValue(fields.OSD_name),
      osdRegion: getFieldValue(fields.OSD_region)
    },
    billingData: {
      billingStartDate: DateHelpers.toISOString(getFieldValue(fields.BillingStartDate)),
      billingEndDate: DateHelpers.toISOString(getFieldValue(fields.BillingEndDate)),
      billedUsage: parseNumber(getFieldValue(fields.BilledUsage)),
      usage12m: parseNumber(getFieldValue(fields['12mUsage']))
    },
    customerData: {
      firstName: getFieldValue(fields.FirstName),
      lastName: getFieldValue(fields.LastName),
      businessName: getFieldValue(fields.BusinessName),
      taxId: getFieldValue(fields.taxID)
    }
  };

  // Usuń puste obiekty
  Object.keys(mappedResult).forEach(key => {
    const typedKey = key as keyof DocumentAnalysisResult;
    const group = mappedResult[typedKey];
    if (group && typeof group === 'object') {
      const hasValues = Object.values(group).some(value => value !== undefined);
      if (!hasValues) {
        delete mappedResult[typedKey];
      }
    }
  });

  // Walidacja wyniku
  const validationResult = safeValidateDocumentAnalysisResult(mappedResult);
  
  if (!validationResult.success) {
    logger.warn('Nieprawidłowy format danych po mapowaniu', {
      error: validationResult.error,
      data: mappedResult
    });
  }

  return mappedResult;
} 