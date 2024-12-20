import type { FieldGroupKey } from '@/types/fields';
import { FIELD_GROUPS } from '@/config/fields';

export function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Najpierw sprawdź czy pole jest zdefiniowane w FIELD_GROUPS
  for (const [groupKey, group] of Object.entries(FIELD_GROUPS)) {
    if (group.fields.includes(fieldName)) {
      return groupKey as FieldGroupKey;
    }
  }

  // Jeśli nie znaleziono bezpośrednio, użyj heurystyki
  
  // Punkt Poboru Energii
  if (fieldNameLower.startsWith('dp') || 
      fieldNameLower.includes('ppe') ||
      fieldNameLower.includes('meter') ||
      fieldNameLower.includes('tariff') ||
      fieldNameLower.includes('contract')) {
    return 'delivery_point';
  }

  // Adres korespondencyjny
  if (fieldNameLower.startsWith('pa') || 
      fieldNameLower.includes('correspondence')) {
    return 'postal_address';
  }

  // Dane sprzedawcy
  if (fieldNameLower.startsWith('supplier') || 
      fieldNameLower.includes('vendor') ||
      fieldNameLower.includes('osd_')) {
    return 'supplier';
  }

  // Dane rozliczeniowe
  if (fieldNameLower.includes('invoice') || 
      fieldNameLower.includes('amount') ||
      fieldNameLower.includes('vat') ||
      fieldNameLower.includes('currency') ||
      fieldNameLower.includes('payment') ||
      fieldNameLower.includes('due')) {
    return 'billing';
  }

  // Informacje o zużyciu
  if (fieldNameLower.includes('usage') || 
      fieldNameLower.includes('consumption') ||
      fieldNameLower.includes('reading') ||
      fieldNameLower.includes('billing') ||
      fieldNameLower.includes('period')) {
    return 'consumption_info';
  }

  // Domyślnie - dane nabywcy
  return 'buyer_data';
} 