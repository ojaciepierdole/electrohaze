import type { DocumentField } from '@/types/document-processing';
import { normalizeText } from '@/utils/text-formatting/core/normalization';

// Typ dla reguł przetwarzania pól
export type FieldRule = (value: string) => string;

// Reguły przetwarzania dla poszczególnych pól
export const fieldRules: Record<string, FieldRule> = {
  // Reguły dla adresów
  Street: (value) => normalizeText(value, { toUpper: true }) || '',
  Building: (value) => normalizeText(value, { toUpper: true }) || '',
  Unit: (value) => normalizeText(value, { toUpper: true }) || '',
  PostalCode: (value) => value?.replace(/[^\d-]/g, '') || '',
  City: (value) => normalizeText(value, { toUpper: true }) || '',
  Municipality: (value) => normalizeText(value, { toUpper: true }) || '',
  District: (value) => normalizeText(value, { toUpper: true }) || '',
  Province: (value) => normalizeText(value, { toUpper: true }) || '',
  
  // Reguły dla numerów i identyfikatorów
  MeterNumber: (value) => normalizeText(value, { toUpper: true }) || '',
  ContractNumber: (value) => normalizeText(value, { toUpper: true }) || '',
  ppeNum: (value) => value?.replace(/[^\d]/g, '') || '',
  taxID: (value) => value?.replace(/[^\d]/g, '') || '',
  
  // Reguły dla pozostałych pól
  BusinessName: (value) => normalizeText(value, { toUpper: true }) || '',
  TariffGroup: (value) => normalizeText(value, { toUpper: true }) || '',
  ContractType: (value) => normalizeText(value, { toUpper: true }) || '',
  OSD_name: (value) => normalizeText(value, { toUpper: true }) || ''
}; 