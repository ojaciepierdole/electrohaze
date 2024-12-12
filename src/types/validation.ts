import { z } from 'zod';
import { ISODateSchema } from './common';

// Podstawowe schematy
export const BaseDataGroupSchema = z.object({
  confidence: z.number().min(0).max(1).optional()
});

export const AddressDataSchema = BaseDataGroupSchema.extend({
  street: z.string().min(1).max(100).optional(),
  building: z.string().min(1).max(20).optional(),
  unit: z.string().min(1).max(20).optional(),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Nieprawidłowy format kodu pocztowego').optional(),
  city: z.string().min(1).max(100).optional()
});

export const PersonDataSchema = BaseDataGroupSchema.extend({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  businessName: z.string().min(1).max(200).optional(),
  taxId: z.string().regex(/^\d{10}$/, 'Nieprawidłowy format NIP').optional(),
  title: z.string().min(1).max(50).optional()
});

// Schemat dla okresu rozliczeniowego
const baseBillingPeriodSchema = BaseDataGroupSchema.extend({
  startDate: ISODateSchema.optional(),
  endDate: ISODateSchema.optional()
}).passthrough();

export const BillingPeriodSchema = baseBillingPeriodSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Data rozpoczęcia musi być wcześniejsza lub równa dacie zakończenia',
    path: ['startDate']
  }
);

// Schematy dla grup danych
export const PPEDataSchema = AddressDataSchema.extend({
  ppeNumber: z.string().regex(/^\d{18}$/, 'Nieprawidłowy format numeru PPE').optional(),
  meterNumber: z.string().min(1).max(50).optional(),
  tariffGroup: z.string().min(1).max(20).optional(),
  contractNumber: z.string().min(1).max(50).optional(),
  contractType: z.string().min(1).max(50).optional(),
  osdName: z.string().min(1).max(100).optional(),
  osdRegion: z.string().min(1).max(100).optional()
}).passthrough();

export const SupplierDataSchema = z.intersection(
  AddressDataSchema,
  PersonDataSchema.extend({
    bankAccount: z.string().regex(/^\d{26}$/, 'Nieprawidłowy format numeru konta').optional(),
    bankName: z.string().min(1).max(100).optional(),
    email: z.string().email('Nieprawidłowy format email').optional(),
    phone: z.string().regex(/^\+?\d{9,15}$/, 'Nieprawidłowy format numeru telefonu').optional(),
    website: z.string().url('Nieprawidłowy format URL').optional(),
    osdName: z.string().min(1).max(100).optional(),
    osdRegion: z.string().min(1).max(100).optional()
  }).passthrough()
);

// Schemat dla danych rozliczeniowych
const baseBillingDataSchema = baseBillingPeriodSchema.extend({
  billedUsage: z.number().min(0).optional(),
  usage12m: z.number().min(0).optional()
});

export const BillingDataSchema = baseBillingDataSchema.refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'Data rozpoczęcia musi być wcześniejsza lub równa dacie zakończenia',
    path: ['startDate']
  }
);

// Główny schemat dla wyniku analizy dokumentu
export const DocumentAnalysisResultSchema = z.object({
  fileName: z.string().min(1).optional(),
  fileUrl: z.string().url().optional(),
  ppeData: PPEDataSchema.optional(),
  correspondenceData: z.intersection(AddressDataSchema, PersonDataSchema).optional(),
  supplierData: SupplierDataSchema.optional(),
  billingData: BillingDataSchema.optional(),
  customerData: PersonDataSchema.optional()
}).passthrough().refine(
  (data) => {
    // Przynajmniej jedna sekcja musi być wypełniona
    return Object.values(data).some(value => value !== undefined);
  },
  {
    message: 'Dokument musi zawierać przynajmniej jedną sekcję danych'
  }
);

// Schemat dla wyniku przetwarzania
export const ProcessingResultSchema = z.object({
  fileName: z.string().min(1),
  modelResults: z.array(z.object({
    modelId: z.string().min(1),
    fields: z.record(z.any()),
    confidence: z.number().min(0).max(1),
    pageCount: z.number().min(1)
  })),
  processingTime: z.number().min(0),
  mappedData: DocumentAnalysisResultSchema,
  cacheStats: z.object({
    size: z.number().min(0),
    maxSize: z.number().min(0),
    ttl: z.number().min(0)
  }),
  performanceStats: z.array(z.any()).optional(),
  alerts: z.array(z.any()).optional()
}).passthrough();

// Typy wnioskowane ze schematów
export type ValidatedDocumentAnalysisResult = z.infer<typeof DocumentAnalysisResultSchema>;
export type ValidatedProcessingResult = z.infer<typeof ProcessingResultSchema>;

// Funkcje pomocnicze do walidacji
export const validateDocumentAnalysisResult = (data: unknown): ValidatedDocumentAnalysisResult => {
  return DocumentAnalysisResultSchema.parse(data);
};

export const validateProcessingResult = (data: unknown): ValidatedProcessingResult => {
  return ProcessingResultSchema.parse(data);
};

// Funkcje do bezpiecznej walidacji (zwracające wynik zamiast rzucania wyjątku)
export const safeValidateDocumentAnalysisResult = (data: unknown) => {
  const result = DocumentAnalysisResultSchema.safeParse(data);
  return {
    isValid: result.success,
    data: result.success ? result.data : undefined,
    errors: !result.success ? result.error.errors : undefined
  };
};

export const safeValidateProcessingResult = (data: unknown) => {
  const result = ProcessingResultSchema.safeParse(data);
  return {
    isValid: result.success,
    data: result.success ? result.data : undefined,
    errors: !result.success ? result.error.errors : undefined
  };
}; 