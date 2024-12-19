import { TransformationRule, TransformationContext, TransformationResult } from '@/types/processing';
import { normalizeText } from '../core/text';

// Słownik standardowych nazw dostawców
const SUPPLIER_NAMES = {
  // Enea
  'ENEA': 'Enea S.A.',
  'ENEA SA': 'Enea S.A.',
  'ENEA SPOLKA AKCYJNA': 'Enea S.A.',
  'ENEA SPÓŁKA AKCYJNA': 'Enea S.A.',
  'ENEA S A': 'Enea S.A.',
  'ENEA TRADING': 'Enea Trading Sp. z o.o.',
  'ENEA TRADING SP Z O O': 'Enea Trading Sp. z o.o.',
  
  // Tauron
  'TAURON': 'Tauron Sprzedaż Sp. z o.o.',
  'TAURON SPRZEDAZ': 'Tauron Sprzedaż Sp. z o.o.',
  'TAURON SPRZEDAŻ': 'Tauron Sprzedaż Sp. z o.o.',
  'TAURON SPRZEDAZ SP Z O O': 'Tauron Sprzedaż Sp. z o.o.',
  'TAURON SPRZEDAŻ SP Z O O': 'Tauron Sprzedaż Sp. z o.o.',
  
  // PGE
  'PGE': 'PGE Obrót S.A.',
  'PGE OBROT': 'PGE Obrót S.A.',
  'PGE OBRÓT': 'PGE Obrót S.A.',
  'PGE OBROT SA': 'PGE Obrót S.A.',
  'PGE OBRÓT SA': 'PGE Obrót S.A.',
  'PGE OBROT S A': 'PGE Obrót S.A.',
  'PGE OBRÓT S A': 'PGE Obrót S.A.',
  
  // Energa
  'ENERGA': 'Energa Obrót S.A.',
  'ENERGA OBROT': 'Energa Obrót S.A.',
  'ENERGA OBRÓT': 'Energa Obrót S.A.',
  'ENERGA OBROT SA': 'Energa Obrót S.A.',
  'ENERGA OBRÓT SA': 'Energa Obrót S.A.',
  'ENERGA OBROT S A': 'Energa Obrót S.A.',
  'ENERGA OBRÓT S A': 'Energa Obrót S.A.',
  
  // E.ON
  'EON': 'E.ON Polska S.A.',
  'E ON': 'E.ON Polska S.A.',
  'E.ON': 'E.ON Polska S.A.',
  'EON POLSKA': 'E.ON Polska S.A.',
  'E ON POLSKA': 'E.ON Polska S.A.',
  'E.ON POLSKA': 'E.ON Polska S.A.',
  'EON POLSKA SA': 'E.ON Polska S.A.',
  'E ON POLSKA SA': 'E.ON Polska S.A.',
  'E.ON POLSKA SA': 'E.ON Polska S.A.',
  'EON POLSKA S A': 'E.ON Polska S.A.',
  'E ON POLSKA S A': 'E.ON Polska S.A.',
  'E.ON POLSKA S A': 'E.ON Polska S.A.'
} as const;

// Funkcja normalizująca nazwę dostawcy
function normalizeSupplierName(value: string): string {
  console.log('[normalizeSupplierName] Start with value:', value);
  
  if (!value) {
    console.log('[normalizeSupplierName] Empty value');
    return '';
  }
  
  // Normalizuj tekst do porównania
  const normalized = normalizeText(value, { 
    toUpper: true, 
    removeSpecial: true,
    normalizePolish: true 
  });
  
  console.log('[normalizeSupplierName] Normalized value:', normalized);
  
  // Sprawdź dokładne dopasowanie
  const exactMatch = SUPPLIER_NAMES[normalized as keyof typeof SUPPLIER_NAMES];
  if (exactMatch) {
    console.log('[normalizeSupplierName] Found exact match:', exactMatch);
    return exactMatch;
  }
  
  // Sprawdź częściowe dopasowania
  for (const [key, properName] of Object.entries(SUPPLIER_NAMES)) {
    if (normalized.includes(key)) {
      console.log('[normalizeSupplierName] Found partial match:', { key, properName });
      return properName;
    }
  }
  
  // Jeśli nie znaleziono dopasowania, zwróć oryginalną wartość
  console.log('[normalizeSupplierName] No match found, returning original');
  return value;
}

// Reguła normalizacji nazwy dostawcy
const supplierNameNormalizationRule: TransformationRule = {
  name: 'supplier-name-normalization',
  description: 'Normalizuje nazwę dostawcy',
  priority: 100,
  condition: (_value: string, context: TransformationContext) => {
    return context.field?.metadata?.fieldType === 'supplier-name';
  },
  transform: (value: string, context: TransformationContext): TransformationResult => {
    console.log('[supplierNameNormalizationRule] Start with value:', value);
    
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

    const normalizedValue = normalizeSupplierName(value);
    const isStandardized = normalizedValue !== value;
    
    console.log('[supplierNameNormalizationRule] Result:', {
      original: value,
      normalized: normalizedValue,
      isStandardized
    });

    return {
      value: normalizedValue,
      content: normalizedValue,
      confidence: isStandardized ? 0.9 : (context.confidence ?? 0),
      metadata: {
        transformationType: 'normalization',
        fieldType: 'supplier-name',
        source: 'supplier-name-normalization',
        originalValue: value,
        status: isStandardized ? 'standardized' : 'unchanged'
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