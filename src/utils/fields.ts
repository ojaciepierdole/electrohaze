import type { FieldGroupKey } from '@/types/processing';

export function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Dane sprzedawcy
  if (fieldNameLower.includes('supplier') || 
      fieldNameLower.includes('vendor') ||
      fieldNameLower.includes('osd_')) {
    return 'supplier_data';
  }

  // Dane biznesowe
  if (fieldNameLower.includes('business') ||
      fieldNameLower.includes('taxid') ||
      fieldNameLower === 'title') {
    return 'business_data';
  }

  // Adres podstawowy
  if (fieldNameLower === 'street' ||
      fieldNameLower === 'building' ||
      fieldNameLower === 'unit' ||
      fieldNameLower === 'city' ||
      fieldNameLower === 'postalcode') {
    return 'primary_address';
  }

  // Adres korespondencyjny
  if (fieldNameLower.startsWith('pa') || 
      fieldNameLower.includes('correspondence')) {
    return 'postal_address';
  }

  // Informacje o zużyciu
  if (fieldNameLower.includes('consumption') || 
      fieldNameLower.includes('usage') ||
      fieldNameLower.includes('reading') ||
      fieldNameLower.includes('billing') ||
      fieldNameLower.includes('period')) {
    return 'consumption_info';
  }
  
  // Domyślnie zwracamy dane biznesowe
  return 'business_data';
} 