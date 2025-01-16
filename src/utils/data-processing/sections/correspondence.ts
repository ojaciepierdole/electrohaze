import { FieldWithConfidence, ProcessedData } from '@/types/processing';
import { getFieldQuality } from '../completeness/confidence';

const DEBUG = false;

// Wagi pól adresu korespondencyjnego
export const CORRESPONDENCE_FIELD_WEIGHTS = {
  // Dane osobowe (suma: 2.0)
  'paFirstName': 1.0,     // Krytyczne
  'paLastName': 1.0,      // Krytyczne
  'paBusinessName': 0.5,  // Opcjonalne
  'paTitle': 0.2,        // Pomocnicze
  
  // Adres (suma: 2.5)
  'paStreet': 0.6,       // Bardzo ważne
  'paBuilding': 0.5,     // Ważne
  'paUnit': 0.2,         // Opcjonalne
  'paPostalCode': 0.6,   // Bardzo ważne
  'paCity': 0.6         // Bardzo ważne
} as const;

// Definicja pól adresu korespondencyjnego
export const CORRESPONDENCE_FIELDS = {
  required: ['paFirstName', 'paLastName', 'paPostalCode', 'paCity'],
  optional: ['paBusinessName', 'paTitle', 'paStreet', 'paBuilding', 'paUnit']
} as const;

/**
 * Oblicza kompletność sekcji adresu korespondencyjnego
 */
export function calculateCorrespondenceCompleteness(data: ProcessedData): number {
  let totalWeight = 0;
  let totalScore = 0;
  
  const correspondenceData = data.correspondence || {};
  
  // Oblicz wynik dla pól wymaganych
  for (const field of CORRESPONDENCE_FIELDS.required) {
    const weight = CORRESPONDENCE_FIELD_WEIGHTS[field] || 0;
    const quality = getFieldQuality(correspondenceData[field]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculateCorrespondenceCompleteness] Pole wymagane ${field}:`, {
        weight,
        quality,
        content: correspondenceData[field]?.content,
        confidence: correspondenceData[field]?.confidence,
        metadata: correspondenceData[field]?.metadata
      });
    }
  }
  
  // Oblicz wynik dla pól opcjonalnych
  for (const field of CORRESPONDENCE_FIELDS.optional) {
    const weight = CORRESPONDENCE_FIELD_WEIGHTS[field] || 0;
    const quality = getFieldQuality(correspondenceData[field]);
    
    totalWeight += weight;
    totalScore += weight * quality;
    
    if (DEBUG) {
      console.log(`[calculateCorrespondenceCompleteness] Pole opcjonalne ${field}:`, {
        weight,
        quality,
        content: correspondenceData[field]?.content,
        confidence: correspondenceData[field]?.confidence,
        metadata: correspondenceData[field]?.metadata
      });
    }
  }
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
} 