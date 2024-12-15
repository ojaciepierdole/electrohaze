import type { 
  DocumentField, 
  TransformationContext, 
  TransformationResult,
  TransformationRule 
} from '@/types/processing';

import { normalizeText } from '@/utils/text-formatting/core/text';
import { STREET_PREFIXES } from '@/utils/text-formatting/dictionaries/addresses';

/**
 * Reguła normalizacji adresu
 */
export const addressNormalizationRule: TransformationRule = {
  name: 'address-normalization',
  description: 'Normalizuje format adresu',
  transform: (context: TransformationContext): TransformationResult => {
    try {
      const { value, confidence } = context;
      if (!value) {
        return { value: '', confidence: 0 };
      }

      // Normalizuj tekst
      const normalized = normalizeText(value, { toUpper: true });

      // Usuń prefiksy ulic
      const withoutPrefix = STREET_PREFIXES.reduce(
        (text, prefix) => text.replace(new RegExp(`^${prefix}\\.?\\s+`, 'i'), ''),
        normalized
      );

      return {
        value: withoutPrefix,
        confidence
      };
    } catch (error) {
      return {
        value: '',
        confidence: 0,
        metadata: {
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
  transform: (context: TransformationContext): TransformationResult => {
    try {
      const { value, confidence } = context;
      if (!value) {
        return { value: '', confidence: 0 };
      }

      // Usuń wszystkie znaki niebędące cyframi
      const cleaned = value.replace(/\D/g, '');

      // Sprawdź czy mamy dokładnie 5 cyfr
      if (cleaned.length !== 5) {
        return { value: '', confidence: 0 };
      }

      // Format XX-XXX
      const formatted = `${cleaned.slice(0,2)}-${cleaned.slice(2)}`;

      return {
        value: formatted,
        confidence
      };
    } catch (error) {
      return {
        value: '',
        confidence: 0,
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
};
