import { TransformationRule, TransformationContext, TransformationResult } from '@/types/processing';
import { splitPersonName } from '@/utils/text-formatting/person';
import { normalizeText } from '../core/text';

// Reguła normalizacji imienia i nazwiska
const personNameNormalizationRule: TransformationRule = {
  name: 'person-name-normalization',
  description: 'Normalizuje imię i nazwisko',
  priority: 100,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value) return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'person-name',
        source: 'person-name-normalization',
        status: 'empty'
      }
    };

    const { firstName, lastName } = splitPersonName(value);
    const isFirstName = Object.keys(context.document?.fields || {}).some(key => 
      key === 'FirstName' && context.document?.fields[key] === context.field
    );
    const result = isFirstName ? firstName : lastName;

    return {
      value: result || value,
      content: result || value,
      confidence: context.confidence ?? 0,
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
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value || !context.document?.fields) {
      return {
        value: '',
        content: '',
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
    const firstName = context.document.fields['FirstName']?.content;
    const lastName = context.document.fields['LastName']?.content;
    const businessName = context.document.fields['BusinessName']?.content;

    // Jeśli mamy nazwę firmy, użyj jej dla pól osobowych
    if (businessName) {
      const normalizedValue = normalizeText(businessName, { toUpper: true }) || '';
      return {
        value: normalizedValue,
        content: normalizedValue,
        confidence: context.document.fields['BusinessName']?.confidence ?? 0,
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
      const isFirstName = Object.keys(context.document?.fields || {}).some(key => 
        key === 'FirstName' && context.document?.fields?.[key] === context.field
      );
      const result = isFirstName ? firstName : lastName;
      const confidence = isFirstName ? 
        context.document.fields['FirstName']?.confidence ?? 0 :
        context.document.fields['LastName']?.confidence ?? 0;

      const normalizedValue = normalizeText(result, { toUpper: true }) || '';
      return {
        value: normalizedValue,
        content: normalizedValue,
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
    const normalizedValue = normalizeText(value, { toUpper: true }) || '';
    return {
      value: normalizedValue,
      content: normalizedValue,
      confidence: context.confidence ?? 0,
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