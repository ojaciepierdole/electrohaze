import { TransformationRule, TransformationContext, TransformationResult } from '@/types/processing';
import { splitPersonName } from '@/utils/text-formatting/person';
import { normalizeText } from '../core/text';

// Reguła normalizacji imienia i nazwiska
const personNameNormalizationRule: TransformationRule = {
  name: 'person-name-normalization',
  description: 'Normalizuje imię i nazwisko',
  priority: 100,
  transform: (context: TransformationContext): TransformationResult => {
    const { value, field } = context;
    if (!value) return {
      value: '',
      confidence: 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'person-name',
        source: 'person-name-normalization',
        status: 'empty'
      }
    };

    const { firstName, lastName } = splitPersonName(value);
    const result = context.field === 'FirstName' ? firstName : lastName;

    return {
      value: result || value,
      confidence: field?.confidence ?? 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'person-name',
        source: 'person-name-normalization',
        originalValue: value,
        status: 'normalized'
      }
    };
  }
};

// Reguła wzbogacania danych osobowych
const personEnrichmentRule: TransformationRule = {
  name: 'person-enrichment',
  description: 'Wzbogaca dane osobowe',
  priority: 90,
  transform: (context: TransformationContext): TransformationResult => {
    const { value, field, document } = context;
    if (!value || !document?.fields) {
      return {
        value: '',
        confidence: 0,
        metadata: {
          transformationType: 'enrichment',
          fieldType: 'person',
          source: 'person-enrichment',
          status: 'no-data'
        }
      };
    }

    // Sprawdź czy mamy powiązane pola
    const firstName = document.fields['FirstName']?.content;
    const lastName = document.fields['LastName']?.content;
    const businessName = document.fields['BusinessName']?.content;

    // Jeśli mamy nazwę firmy, użyj jej dla pól osobowych
    if (businessName) {
      return {
        value: normalizeText(businessName, { toUpper: true }) || '',
        confidence: document.fields['BusinessName']?.confidence ?? 0,
        metadata: {
          transformationType: 'enrichment',
          fieldType: 'person',
          source: 'person-enrichment',
          status: 'business'
        }
      };
    }

    // Jeśli mamy imię i nazwisko, użyj ich
    if (firstName && lastName) {
      const result = context.field === 'FirstName' ? firstName : lastName;
      const confidence = context.field === 'FirstName' ? 
        document.fields['FirstName']?.confidence ?? 0 :
        document.fields['LastName']?.confidence ?? 0;

      return {
        value: normalizeText(result, { toUpper: true }) || '',
        confidence,
        metadata: {
          transformationType: 'enrichment',
          fieldType: 'person',
          source: 'person-enrichment',
          status: 'personal'
        }
      };
    }

    // Jeśli nie mamy żadnych danych, zwróć oryginalną wartość
    return {
      value: normalizeText(value, { toUpper: true }) || '',
      confidence: field?.confidence ?? 0,
      metadata: {
        transformationType: 'enrichment',
        fieldType: 'person',
        source: 'person-enrichment',
        status: 'no-enrichment'
      }
    };
  }
};

// Eksportuj wszystkie reguły osobowe
export const personRules: TransformationRule[] = [
  personNameNormalizationRule,
  personEnrichmentRule
]; 