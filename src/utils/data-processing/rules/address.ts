import type { TransformationRule, TransformationContext, TransformationResult } from '@/types/processing';
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
    content: value,
    confidence: 0.9,
    metadata: {
      fieldType: 'postal_code',
      transformationType: 'direct',
      source: 'raw',
      status: 'success',
      originalValue: value
    }
  })
};

const streetRule: TransformationRule = {
  name: 'street',
  description: 'Nazwa ulicy',
  priority: 1,
  condition: (value: string) => {
    const streetPrefixes = [
      'ul.', 'ulica',
      'al.', 'aleja',
      'pl.', 'plac',
      'os.', 'osiedle',
      'rynek', 'skwer',
      'bulwar', 'park'
    ];
    
    // Sprawdź czy zawiera prefiks lub jest samą nazwą ulicy (min. 3 znaki)
    const hasPrefix = streetPrefixes.some(prefix => 
      value.toLowerCase().includes(prefix)
    );
    
    // Jeśli nie ma prefiksu, sprawdź czy to może być nazwa ulicy
    const isPotentialStreet = value.length > 3 && 
      /^[A-ZŁŚŹŻĆĄĘŃÓ][a-ząęółśżźćń\s-]+$/.test(value);
    
    return hasPrefix || isPotentialStreet;
  },
  transform: (value: string, context: TransformationContext): TransformationResult => ({
    value: normalizeAddress(value),
    content: value,
    confidence: 0.8,
    metadata: {
      fieldType: 'street',
      transformationType: 'normalized',
      source: 'raw',
      status: 'success',
      originalValue: value
    }
  })
};

const cityRule: TransformationRule = {
  name: 'city',
  description: 'Nazwa miasta',
  priority: 1,
  condition: (value: string) => {
    return value.length > 2 && /^[A-ZŁŚŹŻĆĄĘŃÓ][a-ząęółśżźćń]+(?:[\s-][A-ZŁŚŹŻĆĄĘŃÓ][a-ząęółśżźćń]+)*$/.test(value);
  },
  transform: (value: string, context: TransformationContext): TransformationResult => ({
    value: normalizeAddress(value),
    content: value,
    confidence: 0.8,
    metadata: {
      fieldType: 'city',
      transformationType: 'normalized',
      source: 'raw',
      status: 'success',
      originalValue: value
    }
  })
};

export const addressRules = [postalCodeRule, streetRule, cityRule]; 