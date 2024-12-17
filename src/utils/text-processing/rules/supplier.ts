import { TransformationRule, TransformationContext, TransformationResult } from '@/types/processing';
import { normalizeText } from '../core/text';

// Reguła normalizacji nazwy dostawcy
const supplierNameNormalizationRule: TransformationRule = {
  name: 'supplier-name-normalization',
  description: 'Normalizuje nazwę dostawcy',
  priority: 100,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value) return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'supplier-name',
        source: 'supplier-name-normalization',
        status: 'empty'
      }
    };

    const normalizedValue = normalizeText(value, { toUpper: true }) || '';
    return {
      value: normalizedValue,
      content: normalizedValue,
      confidence: context.confidence ?? 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'supplier-name',
        source: 'supplier-name-normalization',
        originalValue: value,
        status: 'normalized'
      }
    };
  }
};

// Reguła normalizacji NIP dostawcy
const supplierTaxIdNormalizationRule: TransformationRule = {
  name: 'supplier-tax-id-normalization',
  description: 'Normalizuje NIP dostawcy',
  priority: 100,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value) return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'supplier-tax-id',
        source: 'supplier-tax-id-normalization',
        status: 'empty'
      }
    };

    // Usuń wszystkie znaki niebędące cyframi
    const cleaned = value.replace(/[^0-9]/g, '');
    
    // Formatuj jako XXX-XXX-XX-XX
    const formatted = cleaned.length === 10 ?
      `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}` :
      cleaned;

    return {
      value: formatted,
      content: formatted,
      confidence: context.confidence ?? 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'supplier-tax-id',
        source: 'supplier-tax-id-normalization',
        originalValue: value,
        status: cleaned.length === 10 ? 'normalized' : 'invalid'
      }
    };
  }
};

// Reguła normalizacji numeru konta bankowego
const bankAccountNormalizationRule: TransformationRule = {
  name: 'bank-account-normalization',
  description: 'Normalizuje numer konta bankowego',
  priority: 100,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value) return {
      value: '',
      content: '',
      confidence: 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'bank-account',
        source: 'bank-account-normalization',
        status: 'empty'
      }
    };

    // Usuń wszystkie znaki niebędące cyframi
    const cleaned = value.replace(/[^0-9]/g, '');
    
    // Formatuj jako XX XXXX XXXX XXXX XXXX XXXX XXXX
    const formatted = cleaned.length === 26 ?
      cleaned.match(/.{1,4}/g)?.join(' ') || cleaned :
      cleaned;

    return {
      value: formatted,
      content: formatted,
      confidence: context.confidence ?? 0,
      metadata: {
        transformationType: 'normalization',
        fieldType: 'bank-account',
        source: 'bank-account-normalization',
        originalValue: value,
        status: cleaned.length === 26 ? 'normalized' : 'invalid'
      }
    };
  }
};

// Reguła wzbogacania danych dostawcy
const supplierEnrichmentRule: TransformationRule = {
  name: 'supplier-enrichment',
  description: 'Wzbogaca dane dostawcy',
  priority: 90,
  transform: (value: string, context: TransformationContext): TransformationResult => {
    if (!value || !context.document?.fields) {
      return {
        value: '',
        content: '',
        confidence: 0,
        metadata: {
          transformationType: 'enrichment',
          fieldType: 'supplier',
          source: 'supplier-enrichment',
          status: 'no-data'
        }
      };
    }

    // Sprawdź czy mamy powiązane pola
    const supplierName = context.document.fields['SupplierName']?.content;
    const supplierTaxId = context.document.fields['SupplierTaxID']?.content;
    const bankAccount = context.document.fields['BankAccount']?.content;

    // Jeśli mamy nazwę i NIP, użyj ich do wzbogacenia
    if (supplierName && supplierTaxId) {
      const currentField = Object.entries(context.document.fields).find(([_, field]) => 
        field === context.field
      )?.[0];

      const result = currentField === 'SupplierName' ? supplierName :
                    currentField === 'SupplierTaxID' ? supplierTaxId :
                    currentField === 'BankAccount' ? bankAccount :
                    value;

      const confidence = currentField === 'SupplierName' ? context.document.fields['SupplierName']?.confidence :
                        currentField === 'SupplierTaxID' ? context.document.fields['SupplierTaxID']?.confidence :
                        currentField === 'BankAccount' ? context.document.fields['BankAccount']?.confidence :
                        context.confidence;

      const normalizedValue = normalizeText(result || '', { toUpper: true }) || '';
      return {
        value: normalizedValue,
        content: normalizedValue,
        confidence: confidence ?? 0,
        metadata: {
          transformationType: 'enrichment',
          fieldType: 'supplier',
          source: 'supplier-enrichment',
          status: 'enriched'
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
        fieldType: 'supplier',
        source: 'supplier-enrichment',
        status: 'no-enrichment'
      }
    };
  }
};

// Eksportuj wszystkie reguły dostawcy
export const supplierRules: TransformationRule[] = [
  supplierNameNormalizationRule,
  supplierTaxIdNormalizationRule,
  bankAccountNormalizationRule,
  supplierEnrichmentRule
]; 