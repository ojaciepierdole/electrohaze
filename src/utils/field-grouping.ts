import type { FieldGroupKey } from '@/types/fields';
import { FIELD_GROUPS } from '@/config/fields';

// Funkcja pomocnicza do określania grupy pola
export function determineFieldGroup(fieldName: string): FieldGroupKey {
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