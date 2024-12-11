import type { FieldGroupKey } from '@/types/processing';

export function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Punkt poboru energii
  if (fieldNameLower.includes('ppe') ||
      fieldNameLower.includes('meter') ||
      fieldNameLower.includes('delivery') ||
      fieldNameLower === 'street' ||
      fieldNameLower === 'building' ||
      fieldNameLower === 'unit' ||
      fieldNameLower === 'city' ||
      fieldNameLower === 'postalcode') {
    return 'delivery_point';
  }

  // Dane nabywcy
  if (fieldNameLower.includes('customer') ||
      fieldNameLower.includes('business') ||
      fieldNameLower.includes('taxid') ||
      fieldNameLower.includes('supplier') || 
      fieldNameLower.includes('vendor') ||
      fieldNameLower.includes('osd_')) {
    return 'buyer_data';
  }

  // Adres korespondencyjny
  if (fieldNameLower.startsWith('pa') || 
      fieldNameLower.includes('correspondence') ||
      fieldNameLower.includes('payer')) {
    return 'postal_address';
  }

  // Informacje o zużyciu
  if (fieldNameLower.includes('consumption') ||
      fieldNameLower.includes('usage') ||
      fieldNameLower.includes('reading') ||
      fieldNameLower.includes('billing') ||
      fieldNameLower.includes('period') ||
      fieldNameLower.includes('product') ||
      fieldNameLower.includes('tariff') ||
      fieldNameLower.includes('sale') ||
      fieldNameLower.includes('invoice') ||
      fieldNameLower.includes('amount') ||
      fieldNameLower.includes('vat') ||
      fieldNameLower.includes('net') ||
      fieldNameLower.includes('total') ||
      fieldNameLower.includes('currency') ||
      fieldNameLower.includes('date')) {
    return 'consumption_info';
  }

  // Domyślnie zwracamy dane nabywcy
  return 'buyer_data';
} 