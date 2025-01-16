import { FieldWithConfidence, ProcessedData } from '@/types/processing';
import { getFieldQuality } from '../completeness/confidence';

const DEBUG = false;

// Wagi pól klienta
export const CUSTOMER_FIELD_WEIGHTS = {
  // Dane osobowe (suma: 2.0)
  'FirstName': 1.0,     // Krytyczne
  'LastName': 1.0,      // Krytyczne
  
  // Dane firmowe (suma: 1.0)
  'BusinessName': 0.6,  // Ważne
  'taxID': 0.4,        // Ważne
  
  // Adres (suma: 2.0)
  'Street': 0.5,       // Bardzo ważne
  'Building': 0.4,     // Ważne
  'Unit': 0.1,        // Opcjonalne
  'PostalCode': 0.5,   // Bardzo ważne
  'City': 0.5         // Bardzo ważne
} as const;

// Definicja pól klienta
export const CUSTOMER_FIELDS = {
  required: ['FirstName', 'LastName', 'PostalCode', 'City'],
  optional: ['BusinessName', 'taxID', 'Street', 'Building', 'Unit']
} as const;

/**
 * Oblicza kompletność sekcji danych klienta
 */
export function calculateCustomerCompleteness(data: ProcessedData): number {
  let totalWeight = 0;
  let totalScore = 0;
  
  const customerData = data.customer || {};
  
  // Oblicz wynik dla pól wymaganych
  for (const field of CUSTOMER_FIELDS.required) {
    const weight = CUSTOMER_FIELD_WEIGHTS[field] || 0;
    const quality = getFieldQuality(customerData[field]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculateCustomerCompleteness] Pole wymagane ${field}:`, {
        weight,
        quality,
        content: customerData[field]?.content,
        confidence: customerData[field]?.confidence,
        metadata: customerData[field]?.metadata
      });
    }
  }
  
  // Oblicz wynik dla pól opcjonalnych
  for (const field of CUSTOMER_FIELDS.optional) {
    const weight = CUSTOMER_FIELD_WEIGHTS[field] || 0;
    const quality = getFieldQuality(customerData[field]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculateCustomerCompleteness] Pole opcjonalne ${field}:`, {
        weight,
        quality,
        content: customerData[field]?.content,
        confidence: customerData[field]?.confidence,
        metadata: customerData[field]?.metadata
      });
    }
  }
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
} 