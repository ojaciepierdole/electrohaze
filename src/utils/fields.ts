import type { FieldGroupKey } from '@/types/processing';

export function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Dane sprzedawcy
  if (fieldNameLower.includes('supplier') || 
      fieldNameLower.includes('vendor') ||
      fieldNameLower.includes('osd_')) {
    return 'supplier';
  }

  // Dane produktu
  if (fieldNameLower.includes('product') ||
      fieldNameLower.includes('tariff') ||
      fieldNameLower.includes('sale')) {
    return 'product';
  }

  // Punkt dostawy
  if (fieldNameLower.includes('ppe') ||
      fieldNameLower.includes('meter') ||
      fieldNameLower.includes('delivery') ||
      fieldNameLower === 'street' ||
      fieldNameLower === 'building' ||
      fieldNameLower === 'unit' ||
      fieldNameLower === 'city' ||
      fieldNameLower === 'postalcode') {
    return 'delivery';
  }

  // Dane ogólne
  if (fieldNameLower.includes('customer') ||
      fieldNameLower.includes('business') ||
      fieldNameLower.includes('taxid')) {
    return 'general';
  }

  // Płatnik
  if (fieldNameLower.startsWith('pa') || 
      fieldNameLower.includes('correspondence') ||
      fieldNameLower.includes('payer')) {
    return 'payer';
  }

  // Faktura
  if (fieldNameLower.includes('invoice') ||
      fieldNameLower.includes('amount') ||
      fieldNameLower.includes('vat') ||
      fieldNameLower.includes('net') ||
      fieldNameLower.includes('total') ||
      fieldNameLower.includes('currency') ||
      fieldNameLower.includes('date')) {
    return 'invoice';
  }

  // Zużycie
  if (fieldNameLower.includes('consumption') ||
      fieldNameLower.includes('usage') ||
      fieldNameLower.includes('reading') ||
      fieldNameLower.includes('billing') ||
      fieldNameLower.includes('period')) {
    return 'consumption';
  }

  // Domyślnie zwracamy dane ogólne
  return 'general';
} 