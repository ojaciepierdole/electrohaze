import type { FieldGroupKey } from '@/types/processing';

export function determineFieldGroup(fieldName: string): FieldGroupKey {
  const fieldNameLower = fieldName.toLowerCase();
  
  // Dane faktury
  if (fieldNameLower.includes('invoice') || 
      fieldNameLower.includes('amount') ||
      fieldNameLower.includes('bill') ||
      fieldNameLower.includes('billing') ||
      fieldNameLower.includes('vat') ||
      fieldNameLower.includes('currency')) {
    return 'invoice_data';
  }

  // Dane sprzedawcy
  if (fieldNameLower.includes('supplier') || 
      fieldNameLower.includes('vendor') ||
      fieldNameLower.includes('osd_') ||
      fieldNameLower === 'businessname') {
    return 'supplier_data';
  }

  // Dane klienta
  if (fieldNameLower.includes('customer') || 
      fieldNameLower === 'firstname' ||
      fieldNameLower === 'lastname' ||
      fieldNameLower === 'taxid') {
    return 'customer_data';
  }

  // Adres korespondencyjny
  if (fieldNameLower.startsWith('postal') || 
      fieldNameLower.includes('correspondence') ||
      fieldNameLower.startsWith('pa')) {
    return 'postal_address';
  }

  // Punkt poboru
  if (fieldNameLower.includes('ppe') || 
      fieldNameLower.includes('meter') ||
      fieldNameLower === 'tariff' ||
      fieldNameLower.startsWith('delivery') ||
      fieldNameLower.startsWith('dp')) {
    return 'delivery_point';
  }

  // Dane zużycia
  if (fieldNameLower.includes('consumption') || 
      fieldNameLower.includes('usage') ||
      fieldNameLower.includes('billed') ||
      fieldNameLower.includes('reading') ||
      fieldNameLower.includes('zużycie')) {
    return 'consumption_data';
  }

  // Dane produktu
  if (fieldNameLower.includes('product') ||
      fieldNameLower.includes('sale')) {
    return 'product_data';
  }
  
  return 'invoice_data'; // domyślna grupa
} 