import { TransformationRule, TransformationContext, TransformationResult } from '@/types/processing';
import { normalizeText } from '../core/text';

// Reguła normalizacji tekstu
const textNormalizationRule: TransformationRule = {
  name: 'text-normalization',
  description: 'Normalizuje tekst',
  priority: 100,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value) return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'text',
        source: 'text-normalization',
        status: 'empty'
      }
    };

    const normalized = normalizeText(value, {
      trim: true,
      removeExtraSpaces: true
    });

    return {
      value: normalized,
      content: normalized,
      confidence: context.confidence ?? 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'text',
        source: 'text-normalization',
        status: 'normalized'
      }
    };
  }
};

// Reguła konwersji do wielkich liter
const upperCaseRule: TransformationRule = {
  name: 'uppercase-conversion',
  description: 'Konwertuje tekst na wielkie litery',
  priority: 90,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value) return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        transformationType: 'conversion',
        fieldType: 'text',
        source: 'uppercase-conversion',
        status: 'empty'
      }
    };

    const normalized = normalizeText(value, {
      trim: true,
      toUpper: true,
      removeExtraSpaces: true
    });

    return {
      value: normalized,
      content: normalized,
      confidence: context.confidence ?? 0,
      metadata: {
        transformationType: 'conversion',
        fieldType: 'text',
        source: 'uppercase-conversion',
        status: 'converted'
      }
    };
  }
};

// Reguła konwersji do małych liter
const lowerCaseRule: TransformationRule = {
  name: 'lowercase-conversion',
  description: 'Konwertuje tekst na małe litery',
  priority: 90,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value) return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        transformationType: 'conversion',
        fieldType: 'text',
        source: 'lowercase-conversion',
        status: 'empty'
      }
    };

    const normalized = normalizeText(value, {
      trim: true,
      toLower: true,
      removeExtraSpaces: true
    });

    return {
      value: normalized,
      content: normalized,
      confidence: context.confidence ?? 0,
      metadata: {
        transformationType: 'conversion',
        fieldType: 'text',
        source: 'lowercase-conversion',
        status: 'converted'
      }
    };
  }
};

// Eksportuj wszystkie reguły tekstu
export const textRules: TransformationRule[] = [
  textNormalizationRule,
  upperCaseRule,
  lowerCaseRule
]; 