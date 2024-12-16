import type { TransformationRule, TransformationContext, TransformationResult } from '@/types/document-processing';
import { cleanSpecialCharacters } from '../core/text';

export const addressRules: TransformationRule[] = [
  {
    name: 'splitAddressLine',
    description: 'Dzieli linię adresu na ulicę, numer budynku i mieszkania',
    priority: 100,
    transform: (value: string, context: TransformationContext): TransformationResult => {
      const originalValue = value;
      const parts = value.split(/[,\s]+/);
      
      if (parts.length < 2) {
        return {
          value: value || '',
          confidence: 1.0,
          metadata: {
            originalValue,
            transformationType: 'splitAddressLine',
            splitType: 'none'
          }
        };
      }

      // Próbuj znaleźć numer budynku i mieszkania
      const buildingMatch = value.match(/(\d+[A-Za-z]?)(\/(\d+[A-Za-z]?))?/);
      if (!buildingMatch) {
        return {
          value: value || '',
          confidence: 1.0,
          metadata: {
            originalValue,
            transformationType: 'splitAddressLine',
            splitType: 'noMatch'
          }
        };
      }

      const buildingNumber = buildingMatch[1];
      const unitNumber = buildingMatch[3];
      const street = value.replace(buildingMatch[0], '').trim();

      const result: TransformationResult = {
        value: street || '',
        confidence: 1.0,
        metadata: {
          originalValue,
          transformationType: 'splitAddressLine',
          splitType: unitNumber ? 'full' : 'building'
        }
      };

      if (context.document?.[context.section || '']) {
        const additionalFields: Record<string, { value: string; confidence: number }> = {};
        
        if (buildingNumber) {
          additionalFields[`${context.section}Building`] = {
            value: buildingNumber,
            confidence: 0.9
          };
        }
        
        if (unitNumber) {
          additionalFields[`${context.section}Unit`] = {
            value: unitNumber,
            confidence: 0.9
          };
        }

        result.additionalFields = additionalFields;
      }

      return result;
    }
  },
  {
    name: 'cleanStreetName',
    description: 'Czyści nazwę ulicy z niepotrzebnych znaków i prefiksów',
    priority: 90,
    transform: (value: string): TransformationResult => {
      const originalValue = value;
      let cleanedValue = value;
      let removedPrefix = false;

      // Usuń typowe prefiksy
      const prefixes = ['ul.', 'ulica', 'al.', 'aleja', 'pl.', 'plac'];
      for (const prefix of prefixes) {
        if (cleanedValue.toLowerCase().startsWith(prefix.toLowerCase())) {
          cleanedValue = cleanedValue.substring(prefix.length).trim();
          removedPrefix = true;
          break;
        }
      }

      return {
        value: cleanedValue || '',
        confidence: removedPrefix ? 0.9 : 1.0,
        metadata: {
          originalValue,
          transformationType: 'cleanStreetName',
          removedPrefix
        }
      };
    }
  },
  {
    name: 'normalizePostalCode',
    description: 'Normalizuje format kodu pocztowego',
    priority: 80,
    transform: (value: string): TransformationResult => {
      const originalValue = value;
      const cleaned = value.replace(/[^\d-]/g, '');
      
      // Sprawdź czy mamy dokładnie 5 cyfr lub format XX-XXX
      const isValid = /^\d{5}$|^\d{2}-\d{3}$/.test(cleaned);
      
      // Jeśli mamy 5 cyfr bez myślnika, dodaj go
      const formatted = cleaned.length === 5 && !cleaned.includes('-') 
        ? `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`
        : cleaned;

      return {
        value: formatted || '',
        confidence: isValid ? 1.0 : 0.8,
        metadata: {
          originalValue,
          transformationType: 'normalizePostalCode'
        }
      };
    }
  },
  {
    name: 'normalizeCity',
    description: 'Normalizuje nazwę miasta',
    priority: 70,
    transform: (value: string): TransformationResult => {
      const originalValue = value;
      const cleaned = cleanSpecialCharacters(value);
      
      return {
        value: cleaned || '',
        confidence: 1.0,
        metadata: {
          originalValue,
          transformationType: 'normalizeCity'
        }
      };
    }
  }
]; 