import { z } from 'zod';
import type { ISODateString } from './common';
import type { DocumentAnalysisResponse, DocumentField } from './azure';
import type { DocumentAnalysisResult } from './processing';

// Interfejs dla wyniku walidacji
export interface ValidationResult {
  success: boolean;
  error?: string;
  confidence?: number;
  fields?: Record<string, DocumentField>;
}

// Schemat dla dat w formacie ISO
export const ISODateSchema = z.string().refine(
  (value) => !isNaN(Date.parse(value)),
  { message: 'Nieprawidłowy format daty' }
) as z.ZodType<ISODateString>;

// Schemat dla adresu
export const AddressSchema = z.object({
  street: z.string().optional(),
  building: z.string().optional(),
  unit: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  municipality: z.string().optional(),
  district: z.string().optional(),
  province: z.string().optional(),
});

// Schemat dla danych osobowych
export const PersonSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  businessName: z.string().optional(),
  title: z.string().optional(),
  taxId: z.string().optional(),
});

// Schemat dla danych PPE
export const PPESchema = AddressSchema.extend({
  ppeNumber: z.string().optional(),
  meterNumber: z.string().optional(),
  tariff: z.string().optional(),
  contractNumber: z.string().optional(),
  contractType: z.string().optional(),
  osdName: z.string().optional(),
  osdRegion: z.string().optional(),
});

// Schemat dla danych dostawcy
export const SupplierSchema = AddressSchema.merge(PersonSchema).extend({
  supplierName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  osdName: z.string().optional(),
  osdRegion: z.string().optional(),
});

// Schemat dla danych rozliczeniowych
export const BillingSchema = z.object({
  billingStartDate: ISODateSchema.optional(),
  billingEndDate: ISODateSchema.optional(),
  billedUsage: z.number().optional(),
  usage12m: z.number().optional(),
});

// Schemat dla wyniku analizy dokumentu
export const DocumentAnalysisSchema = z.object({
  ppeData: PPESchema.optional(),
  correspondenceData: AddressSchema.merge(PersonSchema).optional(),
  supplierData: SupplierSchema.optional(),
  billingData: BillingSchema.optional(),
  customerData: PersonSchema.optional(),
});

// Schemat dla wyniku przetwarzania
export const ProcessingResultSchema = z.object({
  fileName: z.string(),
  modelResults: z.array(z.object({
    modelId: z.string(),
    fields: z.record(z.any()),
    confidence: z.number(),
    pageCount: z.number()
  })),
  processingTime: z.number(),
  mappedData: DocumentAnalysisSchema,
  cacheStats: z.object({
    size: z.number(),
    maxSize: z.number(),
    ttl: z.number()
  }),
  performanceStats: z.array(z.any()).optional(),
  alerts: z.array(z.any()).optional()
});

// Funkcje walidacji
export function safeValidateProcessingResult(data: unknown) {
  const result = ProcessingResultSchema.safeParse(data);
  return {
    success: result.success,
    data: result.success ? result.data : null,
    error: !result.success ? result.error.message : null
  };
}

export function safeValidateDocumentAnalysisResult(result: DocumentAnalysisResponse): ValidationResult {
  if (!result.documents?.[0]) {
    return {
      success: false,
      error: 'Brak dokumentów w wyniku analizy'
    };
  }

  const document = result.documents[0];
  return {
    success: true,
    confidence: document.confidence,
    fields: document.fields
  };
}

export function safeValidateMappedResult(result: DocumentAnalysisResult): ValidationResult {
  const validation = DocumentAnalysisSchema.safeParse(result);
  return {
    success: validation.success,
    error: !validation.success ? validation.error.message : undefined
  };
}

export function validateDocumentAnalysisResult(result: DocumentAnalysisResponse): ValidationResult {
  const validation = safeValidateDocumentAnalysisResult(result);
  if (!validation.success) {
    throw new Error(validation.error);
  }
  return validation;
} 