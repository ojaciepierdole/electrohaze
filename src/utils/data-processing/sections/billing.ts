import { FieldWithConfidence, ProcessedData } from '@/types/processing';
import { getFieldQuality } from '../completeness/confidence';

const DEBUG = false;

// Wagi pól rozliczeniowych
export const BILLING_FIELD_WEIGHTS = {
  // Daty (suma: 2.0)
  'BillingStartDate': 1.0,  // Krytyczne
  'BillingEndDate': 1.0,    // Krytyczne
  
  // Zużycie (suma: 2.0)
  'BilledUsage': 1.2,      // Krytyczne
  '12mUsage': 0.8         // Bardzo ważne
} as const;

// Definicja pól rozliczeniowych
export const BILLING_FIELDS = {
  required: ['BillingStartDate', 'BillingEndDate', 'BilledUsage'],
  optional: ['12mUsage']
} as const;

/**
 * Oblicza kompletność sekcji rozliczeniowej
 */
export function calculateBillingCompleteness(data: ProcessedData): number {
  let totalWeight = 0;
  let totalScore = 0;
  
  const billingData = data.billing || {};
  
  // Oblicz wynik dla pól wymaganych
  for (const field of BILLING_FIELDS.required) {
    const weight = BILLING_FIELD_WEIGHTS[field] || 0;
    const fieldKey = field === 'BillingStartDate' ? 'billingStartDate' :
                    field === 'BillingEndDate' ? 'billingEndDate' :
                    field === 'BilledUsage' ? 'billedUsage' : field;
    const quality = getFieldQuality(billingData[fieldKey]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculateBillingCompleteness] Pole wymagane ${field}:`, {
        weight,
        quality,
        content: billingData[fieldKey]?.content,
        confidence: billingData[fieldKey]?.confidence,
        metadata: billingData[fieldKey]?.metadata
      });
    }
  }
  
  // Oblicz wynik dla pól opcjonalnych
  for (const field of BILLING_FIELDS.optional) {
    const weight = BILLING_FIELD_WEIGHTS[field] || 0;
    const fieldKey = field === '12mUsage' ? 'usage12m' : field;
    const quality = getFieldQuality(billingData[fieldKey]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculateBillingCompleteness] Pole opcjonalne ${field}:`, {
        weight,
        quality,
        content: billingData[fieldKey]?.content,
        confidence: billingData[fieldKey]?.confidence,
        metadata: billingData[fieldKey]?.metadata
      });
    }
  }
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
} 