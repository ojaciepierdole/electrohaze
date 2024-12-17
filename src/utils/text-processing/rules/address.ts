import type { 
  TransformationContext, 
  TransformationResult,
  TransformationRule 
} from '@/types/processing';

import { normalizeText } from '@/utils/text-formatting/core/text';
import { STREET_PREFIXES } from '../../../utils/text-formatting/dictionaries/addresses';

/**
 * Reguła normalizacji adresu
 */
export const addressNormalizationRule: TransformationRule = {
  name: 'address-normalization',
  description: 'Normalizuje format adresu',
  priority: 100,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    try {
      if (!value) {
        return {
          value: '',
          content: '',
          confidence: 0,
          metadata: {
            fieldType: 'text',
            transformationType: 'address_normalization',
            source: 'address_transform',
            status: 'empty'
          }
        };
      }

      // Normalizuj tekst
      const normalized = normalizeText(value, { toUpper: true }) || '';

      // Usuń prefiksy ulic
      const withoutPrefix = STREET_PREFIXES.reduce(
        (text: string, prefix: string) => text.replace(new RegExp(`^${prefix}\\.?\\s+`, 'i'), ''),
        normalized
      );

      return {
        value: withoutPrefix,
        content: withoutPrefix,
        confidence: context.confidence || 0,
        metadata: {
          fieldType: 'text',
          transformationType: 'address_normalization',
          source: 'address_transform',
          status: 'transformed',
          originalValue: value
        }
      };
    } catch (error) {
      return {
        value: '',
        content: '',
        confidence: 0,
        metadata: {
          fieldType: 'text',
          transformationType: 'address_normalization',
          source: 'address_transform',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
};

/**
 * Reguła walidacji kodu pocztowego
 */
export const postalCodeValidationRule: TransformationRule = {
  name: 'postal-code-validation',
  description: 'Waliduje format kodu pocztowego',
  priority: 200,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    try {
      if (!value) {
        return {
          value: '',
          content: '',
          confidence: 0,
          metadata: {
            fieldType: 'postal_code',
            transformationType: 'postal_code_validation',
            source: 'address_transform',
            status: 'empty'
          }
        };
      }

      // Usuń wszystkie znaki niebędące cyframi
      const cleaned = value.replace(/\D/g, '');

      // Sprawdź czy mamy dokładnie 5 cyfr
      if (cleaned.length !== 5) {
        return {
          value: '',
          content: '',
          confidence: 0,
          metadata: {
            fieldType: 'postal_code',
            transformationType: 'postal_code_validation',
            source: 'address_transform',
            status: 'invalid',
            originalValue: value
          }
        };
      }

      // Format XX-XXX
      const formatted = `${cleaned.slice(0,2)}-${cleaned.slice(2)}`;

      return {
        value: formatted,
        content: formatted,
        confidence: context.confidence || 0,
        metadata: {
          fieldType: 'postal_code',
          transformationType: 'postal_code_validation',
          source: 'address_transform',
          status: 'transformed',
          originalValue: value
        }
      };
    } catch (error) {
      return {
        value: '',
        content: '',
        confidence: 0,
        metadata: {
          fieldType: 'postal_code',
          transformationType: 'postal_code_validation',
          source: 'address_transform',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
};
