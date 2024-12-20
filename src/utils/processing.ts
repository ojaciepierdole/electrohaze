import type { 
  ProcessingResult,
  DocumentField,
  FieldWithConfidence,
  DocumentFieldsMap
} from '@/types/processing';
import type { FieldGroupKey } from '@/types/fields';
import { FIELD_GROUPS } from '@/config/fields';

// Funkcja pomocnicza do określania grupy pola
function determineFieldGroup(fieldName: string): FieldGroupKey {
  // Sprawdź każdą grupę pól
  for (const [groupKey, group] of Object.entries(FIELD_GROUPS)) {
    if (group.fields.includes(fieldName)) {
      return groupKey as FieldGroupKey;
    }
  }

  // Jeśli pole nie zostało znalezione w żadnej grupie, użyj heurystyki
  const normalizedField = fieldName.toLowerCase();

  // Punkt Poboru Energii
  if (normalizedField.startsWith('dp') || 
      normalizedField === 'ppenum' || 
      normalizedField === 'meternumber' || 
      normalizedField.includes('tariff') || 
      normalizedField.includes('contract') || 
      normalizedField === 'osd_name' || 
      normalizedField === 'osd_region') {
    return 'delivery_point';
  }

  // Adres korespondencyjny
  if (normalizedField.startsWith('pa')) {
    return 'postal_address';
  }

  // Dane sprzedawcy
  if (normalizedField.startsWith('supplier')) {
    return 'supplier';
  }

  // Dane rozliczeniowe
  if (normalizedField.startsWith('billing') || 
      normalizedField.includes('invoice') || 
      normalizedField.includes('amount') || 
      normalizedField.includes('vat') || 
      normalizedField === 'currency') {
    return 'billing';
  }

  // Informacje o zużyciu
  if (normalizedField.includes('usage') || 
      normalizedField.includes('consumption') || 
      normalizedField.includes('reading')) {
    return 'consumption_info';
  }

  // Domyślnie - dane nabywcy
  return 'buyer_data';
}

// Funkcja do przetwarzania pól dokumentu
export function processDocumentFields(fields: Record<string, DocumentField>): DocumentFieldsMap {
  const result: DocumentFieldsMap = {
    delivery_point: {},
    ppe: {},
    postal_address: {},
    buyer_data: {},
    supplier: {},
    consumption_info: {},
    billing: {}
  };

  // Mapuj pola do odpowiednich grup
  for (const [fieldName, field] of Object.entries(fields)) {
    const group = determineFieldGroup(fieldName);
    result[group][fieldName] = {
      content: field.content,
      confidence: field.confidence,
      kind: field.kind,
      value: field.value,
      metadata: field.metadata
    };
  }

  return result;
}

// Funkcja do obliczania pewności dla grupy pól
export function calculateGroupConfidence(fields: Record<string, FieldWithConfidence>): number {
  const filledFields = Object.values(fields).filter(field => field.content);
  if (filledFields.length === 0) return 0;
  
  return filledFields.reduce((sum, field) => sum + field.confidence, 0) / filledFields.length;
}

// Funkcja do obliczania kompletności dla grupy pól
export function calculateGroupCompleteness(
  fields: Record<string, FieldWithConfidence>,
  requiredFields: string[]
): number {
  if (requiredFields.length === 0) return 1;
  
  const filledRequired = requiredFields.filter(fieldName => fields[fieldName]?.content).length;
  return filledRequired / requiredFields.length;
} 