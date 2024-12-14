import type { FieldWithConfidence } from './types';
import { mergeFieldsWithConfidence } from './person';

// Funkcja do wzbogacania danych dostawcy
export function enrichSupplierFields(
  mainFields: {
    supplierName?: FieldWithConfidence;
    supplierTaxID?: FieldWithConfidence;
    supplierStreet?: FieldWithConfidence;
    supplierBuilding?: FieldWithConfidence;
    supplierUnit?: FieldWithConfidence;
    supplierPostalCode?: FieldWithConfidence;
    supplierCity?: FieldWithConfidence;
    supplierBankAccount?: FieldWithConfidence;
    supplierBankName?: FieldWithConfidence;
    supplierEmail?: FieldWithConfidence;
    supplierPhone?: FieldWithConfidence;
    supplierWebsite?: FieldWithConfidence;
    OSD_name?: FieldWithConfidence;
    OSD_region?: FieldWithConfidence;
  } | undefined,
  options: {
    confidenceThreshold?: number;
  } = {}
): {
  supplierName?: FieldWithConfidence;
  supplierTaxID?: FieldWithConfidence;
  supplierStreet?: FieldWithConfidence;
  supplierBuilding?: FieldWithConfidence;
  supplierUnit?: FieldWithConfidence;
  supplierPostalCode?: FieldWithConfidence;
  supplierCity?: FieldWithConfidence;
  supplierBankAccount?: FieldWithConfidence;
  supplierBankName?: FieldWithConfidence;
  supplierEmail?: FieldWithConfidence;
  supplierPhone?: FieldWithConfidence;
  supplierWebsite?: FieldWithConfidence;
  OSD_name?: FieldWithConfidence;
  OSD_region?: FieldWithConfidence;
} {
  const { confidenceThreshold = 0.3 } = options;

  return {
    supplierName: mergeFieldsWithConfidence([{ field: mainFields?.supplierName }], { confidenceThreshold }),
    supplierTaxID: mergeFieldsWithConfidence([{ field: mainFields?.supplierTaxID }], { confidenceThreshold }),
    supplierStreet: mergeFieldsWithConfidence([{ field: mainFields?.supplierStreet }], { confidenceThreshold }),
    supplierBuilding: mergeFieldsWithConfidence([{ field: mainFields?.supplierBuilding }], { confidenceThreshold }),
    supplierUnit: mergeFieldsWithConfidence([{ field: mainFields?.supplierUnit }], { confidenceThreshold }),
    supplierPostalCode: mergeFieldsWithConfidence([{ field: mainFields?.supplierPostalCode }], { confidenceThreshold }),
    supplierCity: mergeFieldsWithConfidence([{ field: mainFields?.supplierCity }], { confidenceThreshold }),
    supplierBankAccount: mergeFieldsWithConfidence([{ field: mainFields?.supplierBankAccount }], { confidenceThreshold }),
    supplierBankName: mergeFieldsWithConfidence([{ field: mainFields?.supplierBankName }], { confidenceThreshold }),
    supplierEmail: mergeFieldsWithConfidence([{ field: mainFields?.supplierEmail }], { confidenceThreshold }),
    supplierPhone: mergeFieldsWithConfidence([{ field: mainFields?.supplierPhone }], { confidenceThreshold }),
    supplierWebsite: mergeFieldsWithConfidence([{ field: mainFields?.supplierWebsite }], { confidenceThreshold }),
    OSD_name: mergeFieldsWithConfidence([{ field: mainFields?.OSD_name }], { confidenceThreshold }),
    OSD_region: mergeFieldsWithConfidence([{ field: mainFields?.OSD_region }], { confidenceThreshold })
  };
}

// Funkcja do formatowania numeru NIP
export function formatTaxID(value: string | null): string | null {
  if (!value) return null;
  // Usuń wszystkie znaki niebędące cyframi
  const cleaned = value.replace(/\D/g, '');
  // Format NIP: XXX-XXX-XX-XX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6,8)}-${cleaned.slice(8)}`;
  }
  return value;
}

// Funkcja do formatowania numeru konta bankowego
export function formatBankAccount(value: string | null): string | null {
  if (!value) return null;
  // Usuń wszystkie znaki niebędące cyframi
  const cleaned = value.replace(/\D/g, '');
  // Format: XX XXXX XXXX XXXX XXXX XXXX XXXX
  if (cleaned.length === 26) {
    return cleaned.match(/.{1,4}/g)?.join(' ') || value;
  }
  return value;
}

// Funkcja do formatowania numeru telefonu
export function formatPhoneNumber(value: string | null): string | null {
  if (!value) return null;
  // Usuń wszystkie znaki niebędące cyframi
  const cleaned = value.replace(/\D/g, '');
  // Format: XXX-XXX-XXX
  if (cleaned.length === 9) {
    return `${cleaned.slice(0,3)}-${cleaned.slice(3,6)}-${cleaned.slice(6)}`;
  }
  return value;
}

// Funkcja do formatowania nazwy dostawcy
export function formatSupplierName(value: string | null): string | null {
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