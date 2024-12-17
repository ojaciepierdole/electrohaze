import type { TransformationRule, TransformationContext, TransformationResult } from '@/types/document';
import { extractPostalCode, normalizeAddress } from '../helpers/address-helpers';

const postalCodeRule: TransformationRule = {
  name: 'postal_code',
  description: 'Kod pocztowy w formacie XX-XXX',
  priority: 1,
  condition: (value: string) => {
    return /^\d{2}-\d{3}$/.test(value);
  },
  transform: (value: string, context: TransformationContext): TransformationResult => ({
    value,
    confidence: 0.9,
    metadata: {
      fieldType: 'postal_code',
      transformationType: 'direct'
    }
  })
};

const streetRule: TransformationRule = {
  name: 'street',
  description: 'Nazwa ulicy',
  priority: 1,
  condition: (value: string) => {
    return value.length > 3 && (
      value.toLowerCase().includes('ul.') || 
      value.toLowerCase().includes('ulica') ||
      value.toLowerCase().includes('al.') ||
      value.toLowerCase().includes('aleja')
    );
  },
  transform: (value: string, context: TransformationContext): TransformationResult => ({
    value: normalizeAddress(value),
    confidence: 0.8,
    metadata: {
      fieldType: 'street',
      transformationType: 'normalized'
    }
  })
};

const cityRule: TransformationRule = {
  name: 'city',
  description: 'Nazwa miasta',
  priority: 1,
  condition: (value: string) => {
    return value.length > 2 && /^[A-ZŁŚŹŻĆĄĘŃÓ][a-ząęółśżźćń]+$/.test(value);
  },
  transform: (value: string, context: TransformationContext): TransformationResult => ({
    value: normalizeAddress(value),
    confidence: 0.8,
    metadata: {
      fieldType: 'city',
      transformationType: 'normalized'
    }
  })
};

export const addressRules = [postalCodeRule, streetRule, cityRule]; 