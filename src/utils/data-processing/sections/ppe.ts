import { FieldWithConfidence, ProcessedData } from '@/types/processing';
import { getFieldQuality } from '../completeness/confidence';

const DEBUG = false;

// Wagi pól PPE
export const PPE_FIELD_WEIGHTS = {
  // Identyfikatory (suma: 2.0)
  'ppeNum': 1.0,        // Krytyczne
  'MeterNumber': 1.0,   // Krytyczne
  
  // Dane techniczne (suma: 1.5)
  'TariffGroup': 0.8,   // Bardzo ważne
  'ContractNumber': 0.4,// Ważne
  'ContractType': 0.3,  // Pomocnicze
  
  // Lokalizacja (suma: 1.5)
  'Street': 0.4,        // Ważne
  'Building': 0.3,      // Ważne
  'Unit': 0.1,         // Opcjonalne
  'PostalCode': 0.4,    // Ważne
  'City': 0.3,         // Ważne
  
  // Dane administracyjne (suma: 0.5)
  'Municipality': 0.2,  // Pomocnicze
  'District': 0.2,      // Pomocnicze
  'Province': 0.1       // Pomocnicze
} as const;

// Definicja pól PPE
export const PPE_FIELDS = {
  required: ['ppeNum', 'MeterNumber', 'TariffGroup', 'PostalCode', 'City'],
  optional: ['ContractNumber', 'ContractType', 'Street', 'Building', 'Unit', 'Municipality', 'District', 'Province']
} as const;

/**
 * Oblicza kompletność sekcji PPE
 */
export function calculatePPECompleteness(data: ProcessedData): number {
  let totalWeight = 0;
  let totalScore = 0;
  
  const ppeData = data.ppe || {};
  
  // Oblicz wynik dla pól wymaganych
  for (const field of PPE_FIELDS.required) {
    const weight = PPE_FIELD_WEIGHTS[field] || 0;
    const quality = getFieldQuality(ppeData[field]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculatePPECompleteness] Pole wymagane ${field}:`, {
        weight,
        quality,
        content: ppeData[field]?.content,
        confidence: ppeData[field]?.confidence,
        metadata: ppeData[field]?.metadata
      });
    }
  }
  
  // Oblicz wynik dla pól opcjonalnych
  for (const field of PPE_FIELDS.optional) {
    const weight = PPE_FIELD_WEIGHTS[field] || 0;
    const quality = getFieldQuality(ppeData[field]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculatePPECompleteness] Pole opcjonalne ${field}:`, {
        weight,
        quality,
        content: ppeData[field]?.content,
        confidence: ppeData[field]?.confidence,
        metadata: ppeData[field]?.metadata
      });
    }
  }
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
} 