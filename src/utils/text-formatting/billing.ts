import type { FieldWithConfidence } from './types';
import { mergeFieldsWithConfidence } from './person';
import { formatDate } from './numbers';

// Funkcja do wzbogacania danych rozliczeniowych
export function enrichBillingFields(
  mainFields: {
    BillingStartDate?: FieldWithConfidence;
    BillingEndDate?: FieldWithConfidence;
    ProductName?: FieldWithConfidence;
    Tariff?: FieldWithConfidence;
    BilledUsage?: FieldWithConfidence;
    ReadingType?: FieldWithConfidence;
    '12mUsage'?: FieldWithConfidence;
    InvoiceType?: FieldWithConfidence;
    BillBreakdown?: FieldWithConfidence;
    EnergySaleBreakdown?: FieldWithConfidence;
  } | undefined,
  options: {
    confidenceThreshold?: number;
  } = {}
): {
  BillingStartDate?: FieldWithConfidence;
  BillingEndDate?: FieldWithConfidence;
  ProductName?: FieldWithConfidence;
  Tariff?: FieldWithConfidence;
  BilledUsage?: FieldWithConfidence;
  ReadingType?: FieldWithConfidence;
  '12mUsage'?: FieldWithConfidence;
  InvoiceType?: FieldWithConfidence;
  BillBreakdown?: FieldWithConfidence;
  EnergySaleBreakdown?: FieldWithConfidence;
} {
  const { confidenceThreshold = 0.3 } = options;

  return {
    BillingStartDate: mergeFieldsWithConfidence([{ field: mainFields?.BillingStartDate }], { confidenceThreshold }),
    BillingEndDate: mergeFieldsWithConfidence([{ field: mainFields?.BillingEndDate }], { confidenceThreshold }),
    ProductName: mergeFieldsWithConfidence([{ field: mainFields?.ProductName }], { confidenceThreshold }),
    Tariff: mergeFieldsWithConfidence([{ field: mainFields?.Tariff }], { confidenceThreshold }),
    BilledUsage: mergeFieldsWithConfidence([{ field: mainFields?.BilledUsage }], { confidenceThreshold }),
    ReadingType: mergeFieldsWithConfidence([{ field: mainFields?.ReadingType }], { confidenceThreshold }),
    '12mUsage': mergeFieldsWithConfidence([{ field: mainFields?.['12mUsage'] }], { confidenceThreshold }),
    InvoiceType: mergeFieldsWithConfidence([{ field: mainFields?.InvoiceType }], { confidenceThreshold }),
    BillBreakdown: mergeFieldsWithConfidence([{ field: mainFields?.BillBreakdown }], { confidenceThreshold }),
    EnergySaleBreakdown: mergeFieldsWithConfidence([{ field: mainFields?.EnergySaleBreakdown }], { confidenceThreshold })
  };
}

// Funkcja do formatowania typu odczytu
export function formatReadingType(value: string | null): string | null {
  if (!value) return null;
  const readingTypes = {
    'RZECZYWISTY': 'Rzeczywisty',
    'SZACOWANY': 'Szacowany',
    'PROGNOZOWANY': 'Prognozowany'
  };
  const upperValue = value.toUpperCase();
  return readingTypes[upperValue as keyof typeof readingTypes] || value;
}

// Funkcja do formatowania typu faktury
export function formatInvoiceType(value: string | null): string | null {
  if (!value) return null;
  const invoiceTypes = {
    'ROZLICZENIOWA': 'Rozliczeniowa',
    'PROGNOZA': 'Prognoza',
    'KOREKTA': 'Korekta'
  };
  const upperValue = value.toUpperCase();
  return invoiceTypes[upperValue as keyof typeof invoiceTypes] || value;
}

// Funkcja do formatowania taryfy
export function formatTariff(value: string | null): string | null {
  if (!value) return null;
  // Usuń białe znaki i zamień na wielkie litery
  return value.replace(/\s+/g, '').toUpperCase();
}

// Funkcja do formatowania nazwy produktu
export function formatProductName(value: string | null): string | null {
  if (!value) return null;
  
  // Usuń nadmiarowe białe znaki i znaki specjalne
  const cleaned = value
    .replace(/["""()[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return null;

  // Tylko konwersja na wielkie litery
  return cleaned.toUpperCase();
} 