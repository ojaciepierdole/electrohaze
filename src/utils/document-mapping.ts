// Funkcja mapująca surowe dane do naszej struktury
import type { DocumentAnalysisResult } from '@/types/processing';
import type { DocumentField } from '@azure/ai-form-recognizer';
import { DateHelpers } from '@/types/common';
import { 
  safeValidateDocumentAnalysisResult, 
  ValidatedDocumentAnalysisResult 
} from '@/types/validation';
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

export function mapDocumentAnalysisResult(fields: Record<string, DocumentField>): DocumentAnalysisResult {
  const mappedResult: DocumentAnalysisResult = {
    ppeData: {
      ppeNumber: fields.ppeNum?.value || undefined,
      meterNumber: fields.MeterNumber?.value || undefined,
      tariffGroup: fields.Tariff?.value || undefined,
      contractNumber: fields.ContractNumber?.value || undefined,
      contractType: fields.ContractType?.value || undefined,
      street: fields.dpStreet?.value || undefined,
      building: fields.dpBuilding?.value || undefined,
      unit: fields.dpUnit?.value || undefined,
      city: fields.dpCity?.value?.replace(',', '') || undefined,
      confidence: fields.ppeNum?.confidence || undefined,
      osdName: fields.OSD_name?.value || undefined,
      osdRegion: fields.OSD_region?.value || undefined
    },
    correspondenceData: {
      firstName: fields.paFirstName?.value || undefined,
      lastName: fields.paLastName?.value || undefined,
      businessName: fields.paBusinessName?.value || undefined,
      title: fields.paTitle?.value || undefined,
      street: fields.paStreet?.value || undefined,
      building: fields.paBuilding?.value || undefined,
      unit: fields.paUnit?.value || undefined,
      postalCode: fields.paPostalCode?.value || undefined,
      city: fields.paCity?.value || undefined,
      confidence: fields.paFirstName?.confidence || fields.paLastName?.confidence || undefined
    },
    supplierData: {
      supplierName: fields.supplierName?.value || undefined,
      taxId: fields.taxID?.value || undefined,
      street: fields.supplierStreet?.value || undefined,
      building: fields.supplierBuilding?.value || undefined,
      unit: fields.supplierUnit?.value || undefined,
      postalCode: fields.supplierPostalCode?.value || undefined,
      city: fields.supplierCity?.value || undefined,
      bankAccount: fields.supplierBankAccount?.value || undefined,
      bankName: fields.supplierBankName?.value || undefined,
      email: fields.supplierEmail?.value || undefined,
      phone: fields.supplierPhone?.value || undefined,
      website: fields.supplierWebsite?.value || undefined,
      osdName: fields.OSD_name?.value || undefined,
      osdRegion: fields.OSD_region?.value || undefined,
      confidence: fields.supplierName?.confidence || undefined
    },
    billingData: {
      billingStartDate: DateHelpers.toISOString(fields.BillingStartDate?.value || undefined),
      billingEndDate: DateHelpers.toISOString(fields.BillingEndDate?.value || undefined),
      billedUsage: fields.BilledUsage?.value
        ? parseFloat(fields.BilledUsage.value.replace(',', '.'))
        : undefined,
      usage12m: fields['12mUsage']?.value
        ? parseFloat(fields['12mUsage'].value.replace(',', '.'))
        : undefined,
      confidence: fields.BillingStartDate?.confidence || fields.BillingEndDate?.confidence || undefined
    },
    customerData: {
      firstName: fields.FirstName?.value || undefined,
      lastName: fields.LastName?.value || undefined,
      businessName: fields.BusinessName?.value || undefined,
      taxId: fields.taxID?.value || undefined,
      confidence: fields.FirstName?.confidence || fields.LastName?.confidence || undefined
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
  
  if (!validationResult.isValid) {
    logger.warn('Nieprawidłowy format danych po mapowaniu', {
      errors: validationResult.errors,
      data: mappedResult
    });
  }

  return mappedResult;
} 