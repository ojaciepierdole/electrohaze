import type { TransformationContext, TransformationResult } from '@/types/processing';
import { normalizeText } from '@/utils/data-processing/core/normalization';
import { enrichAddress } from '@/utils/text-formatting/address';
import { STREET_PREFIXES } from '@/utils/text-formatting/dictionaries/addresses';

// Konwertuj readonly array na mutable array
const streetPrefixes = [...STREET_PREFIXES];

export function enrichText(value: string, context: TransformationContext): TransformationResult {
  // Użyj fieldType z kontekstu lub domyślnej wartości
  const fieldType = context.metadata?.fieldName?.includes('address') ? 'address' : 'text';

  if (!value) {
    return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        fieldType,
        transformationType: 'enrichment',
        source: 'enrichment',
        status: 'empty'
      }
    };
  }

  // Jeśli to pole adresowe, użyj specjalnej logiki
  if (context.metadata?.fieldName?.includes('address') || context.metadata?.fieldName?.includes('street')) {
    const enriched = enrichAddress(value, 'Street');
    return {
      value: enriched || value,
      content: enriched || value,
      confidence: enriched ? 0.9 : 0.5,
      metadata: {
        fieldType,
        transformationType: 'enrichment',
        source: 'enrichment',
        status: enriched ? 'enriched' : 'unchanged'
      }
    };
  }

  // Standardowa normalizacja tekstu
  const normalizedValue = normalizeText(value);
  return {
    value: normalizedValue || value,
    content: normalizedValue || value,
    confidence: normalizedValue ? 0.8 : 0.5,
    metadata: {
      fieldType,
      transformationType: 'enrichment',
      source: 'enrichment',
      status: normalizedValue ? 'transformed' : 'unchanged'
    }
  };
} 