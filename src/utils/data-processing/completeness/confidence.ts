import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField } from '@/types/processing';

export interface DocumentSections {
  ppe?: Record<string, DocumentField>;
  customer?: Record<string, DocumentField>;
  correspondence?: Record<string, DocumentField>;
  supplier?: Record<string, DocumentField>;
  billing?: Record<string, DocumentField>;
}

// Sprawdza czy adres jest kompletny
function isAddressComplete(data: Record<string, DocumentField> | undefined, prefix: string = ''): boolean {
  if (!data) return false;

  // Podstawowe pola adresowe
  const requiredFields = [
    prefix + 'Street',
    prefix + 'Building',
    prefix + 'PostalCode',
    prefix + 'City'
  ];

  // Alternatywne nazwy pól
  const alternativeFields = {
    [prefix + 'Street']: [prefix + 'Address', prefix + 'StreetName'],
    [prefix + 'Building']: [prefix + 'BuildingNumber', prefix + 'HouseNumber'],
    [prefix + 'PostalCode']: [prefix + 'ZipCode', prefix + 'Zip'],
    [prefix + 'City']: [prefix + 'Town', prefix + 'Municipality']
  };

  return requiredFields.every(field => {
    // Sprawdź podstawowe pole
    const value = data[field]?.content;
    if (value !== undefined && value !== null && value !== '') {
      return true;
    }

    // Sprawdź alternatywne pola
    const alternatives = alternativeFields[field] || [];
    return alternatives.some(altField => {
      const altValue = data[altField]?.content;
      return altValue !== undefined && altValue !== null && altValue !== '';
    });
  });
}

// Sprawdza czy dane osobowe są kompletne
function isPersonalDataComplete(data: Record<string, DocumentField> | undefined, prefix: string = ''): boolean {
  if (!data) return false;

  // Sprawdź czy mamy dane osoby fizycznej
  const hasPersonalData = Boolean(
    data[prefix + 'FirstName']?.content &&
    data[prefix + 'LastName']?.content
  );

  // Sprawdź czy mamy dane firmy
  const hasBusinessData = Boolean(
    data[prefix + 'BusinessName']?.content &&
    data[prefix + 'taxID']?.content
  );

  // Wystarczy, że mamy albo dane osobowe, albo dane firmy
  return hasPersonalData || hasBusinessData;
}

// Wagi dla sprawdzania przydatności
const usabilityWeights = {
  ppe: 0.4,        // Dane PPE są najważniejsze
  customer: 0.3,   // Dane klienta są drugie w kolejności
  address: 0.2,    // Adres jest trzeci
  billing: 0.1     // Dane rozliczeniowe są opcjonalne
};

// Sprawdza czy dokument jest przydatny (ma wszystkie wymagane pola do podpisania umowy)
export function calculateUsability(sections: DocumentSections): boolean {
  // 1. Wymagane dane PPE
  const ppeFields = sections.ppe || {};
  const hasPPENumber = Boolean(
    ppeFields.ppeNum?.content ||
    ppeFields.PPENumber?.content ||
    ppeFields.PointNumber?.content
  );

  const hasTariff = Boolean(
    ppeFields.TariffGroup?.content ||
    ppeFields.Tariff?.content ||
    ppeFields.TariffName?.content
  );
  
  const hasPPEData = hasPPENumber && hasTariff;
  
  console.log('Debug PPE data:', {
    hasPPENumber,
    hasTariff,
    hasPPEData,
    ppeFields
  });

  // 2. Wymagane dane osobowe klienta
  const hasCustomerData = isPersonalDataComplete(sections.customer);
  
  console.log('Customer data:', {
    hasCustomerData,
    customerFields: sections.customer
  });

  // 3. Wymagany kompletny adres (wystarczy jeden z trzech)
  const hasPPEAddress = isAddressComplete(sections.ppe, 'dp');
  const hasCustomerAddress = isAddressComplete(sections.customer);
  const hasCorrespondenceAddress = isAddressComplete(sections.correspondence, 'pa');
  
  const hasValidAddress = hasPPEAddress || hasCustomerAddress || hasCorrespondenceAddress;
  
  console.log('Address validation:', {
    hasPPEAddress,
    hasCustomerAddress,
    hasCorrespondenceAddress,
    hasValidAddress
  });

  // 4. Dane rozliczeniowe (opcjonalne, ale jeśli są, to muszą być kompletne)
  const hasBillingData = sections.billing ? (
    Boolean(sections.billing.billingStartDate?.content) &&
    Boolean(sections.billing.billingEndDate?.content) &&
    Boolean(sections.billing.billedUsage?.content)
  ) : true;

  // Dokument jest przydatny tylko jeśli ma wszystkie wymagane dane
  const isUsable = hasPPEData && hasCustomerData && hasValidAddress && hasBillingData;
  
  console.log('Final usability:', {
    isUsable,
    conditions: {
      hasPPEData,
      hasCustomerData,
      hasValidAddress,
      hasBillingData
    }
  });

  return isUsable;
}

interface SectionWeights {
  ppe: number;
  customer: number;
  correspondence: number;
  supplier: number;
  billing: number;
}

// Wagi dla różnych typów pól
const fieldWeights: Record<string, number> = {
  // PPE (suma: 4.0)
  'ppeNum': 1.5,           // Krytyczne - zwiększona waga
  'MeterNumber': 1.0,      // Ważne - zwiększona waga
  'TariffGroup': 1.0,      // Bardzo ważne - zwiększona waga
  'Tariff': 0.5,           // Alternatywa dla TariffGroup
  
  // Dane osobowe (suma: 3.5)
  'FirstName': 1.0,        // Bardzo ważne
  'LastName': 1.0,         // Bardzo ważne
  'BusinessName': 1.0,     // Alternatywa dla FirstName+LastName
  'taxID': 0.5,           // Ważne dla firm
  
  // Adres (suma: 3.0)
  'Street': 1.0,          // Bardzo ważne
  'Building': 0.8,        // Bardzo ważne
  'PostalCode': 0.7,      // Ważne
  'City': 0.5,           // Ważne
  
  // Dostawca (suma: 2.5)
  'supplierName': 1.0,    // Bardzo ważne
  'OSD_name': 1.0,       // Ważne - zwiększona waga
  'OSD_region': 0.5,     // Pomocnicze
  
  // Rozliczenia (suma: 2.0)
  'billingStartDate': 0.7,
  'billingEndDate': 0.7,
  'billedUsage': 0.6
};

const defaultWeights: SectionWeights = {
  ppe: 0.35,        // Zwiększona waga
  customer: 0.25,   // Bez zmian
  correspondence: 0.15,  // Bez zmian
  supplier: 0.15,   // Zmniejszona waga
  billing: 0.1      // Bez zmian
};

// Minimalne progi pewności dla różnych poziomów jakości
const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.80,    // Obniżony próg wysokiej pewności
  MEDIUM: 0.60,  // Obniżony próg średniej pewności
  LOW: 0.35      // Obniżony próg niskiej pewności
};

// Cache dla znormalizowanych wartości
const normalizedContentCache = new Map<string, string>();

// Funkcja normalizująca tekst z cache
function normalizeContent(content: string): string {
  const cached = normalizedContentCache.get(content);
  if (cached) return cached;
  
  const normalized = content.trim().toLowerCase();
  normalizedContentCache.set(content, normalized);
  return normalized;
}

// Zoptymalizowana funkcja sprawdzająca jakość pola
export function getFieldQuality(field: DocumentField | undefined): number {
  if (!field?.content || !field.confidence) return 0;

  const content = field.content;
  const cachedNormalized = normalizeContent(content);
  if (cachedNormalized.length === 0) return 0;
  
  let quality = field.confidence;

  // Szybkie sprawdzenie znaków specjalnych
  if (cachedNormalized.includes('?') || cachedNormalized.includes('*')) {
    quality *= 0.6;
  }

  // Optymalizacja dla krótkich wartości
  const contentLength = cachedNormalized.length;
  if (contentLength <= 3) {
    if (/^\d+[A-Za-z]?$/.test(cachedNormalized)) {
      return field.confidence;
    }
    return quality;
  }

  // Premia za długie wartości
  quality *= 1.1;

  // Premia za wysoką pewność
  if (field.confidence > 0.9) {
    quality *= 1.05;
  }

  return Math.min(quality, 1);
}

// Zoptymalizowana funkcja deduplikacji
function deduplicateFields(data: Record<string, DocumentField | undefined>): Record<string, DocumentField | undefined> {
  const result: Record<string, DocumentField | undefined> = {};
  const seenValues = new Map<string, { field: string; confidence: number }>();

  // Jednorazowe przetworzenie wszystkich wartości
  const entries = Object.entries(data);
  const validEntries = entries.filter(([_, value]) => value?.content);

  // Znajdź najlepsze wartości w jednym przejściu
  for (const [field, value] of validEntries) {
    if (!value?.content) continue;
    
    const normalizedContent = normalizeContent(value.content);
    const currentConfidence = value.confidence || 0;
    
    const existing = seenValues.get(normalizedContent);
    if (!existing || currentConfidence > existing.confidence) {
      seenValues.set(normalizedContent, { field, confidence: currentConfidence });
    }
  }

  // Zbuduj wynik w jednym przejściu
  for (const [field, value] of entries) {
    if (!value?.content) {
      result[field] = value;
      continue;
    }

    const normalizedContent = normalizeContent(value.content);
    const best = seenValues.get(normalizedContent);
    
    result[field] = best && best.field === field ? value : undefined;
  }

  return result;
}

// Cache dla wyników hasFieldValue
const fieldValueCache = new Map<string, boolean>();

// Zoptymalizowana funkcja sprawdzająca wartość pola
function hasFieldValue(
  data: Record<string, DocumentField | undefined>,
  field: string,
  alternatives: string[] = []
): boolean {
  const cacheKey = `${field}:${alternatives.join(',')}`;
  const cached = fieldValueCache.get(cacheKey);
  if (cached !== undefined) return cached;

  // Sprawdź główne pole
  if (data[field]?.content) {
    fieldValueCache.set(cacheKey, true);
    return true;
  }

  // Sprawdź alternatywy tylko jeśli główne pole jest puste
  const hasAlternative = alternatives.some(alt => data[alt]?.content);
  fieldValueCache.set(cacheKey, hasAlternative);
  return hasAlternative;
}

// Dodajemy interfejsy dla struktury pól
interface FieldDefinition {
  required: string[];
  optional: string[];
  alternatives: Record<string, string[]>;
}

interface RequiredFields {
  ppe: FieldDefinition;
  customer: FieldDefinition;
  correspondence: FieldDefinition;
  supplier: FieldDefinition;
  billing: FieldDefinition;
}

// Aktualizujemy funkcję calculateSectionConfidence aby przyjmowała FieldDefinition
function calculateSectionConfidence(
  data: Record<string, DocumentField | undefined> | undefined,
  definition: FieldDefinition
): { confidence: number; validFields: number; totalFields: number } {
  if (!data) return { 
    confidence: 0, 
    validFields: 0, 
    totalFields: definition.required.length + definition.optional.length 
  };

  // Deduplikuj wartości w sekcji
  const deduplicatedData = deduplicateFields(data);

  let totalWeight = 0;
  let weightedConfidence = 0;
  let validFields = 0;
  const allFields = [...definition.required, ...definition.optional];
  const totalFields = allFields.length;

  for (const field of allFields) {
    const fieldData = deduplicatedData[field];
    if (!fieldData?.content) continue;

    const fieldWeight = fieldWeights[field] || 0.5;
    const quality = getFieldQuality(fieldData);

    if (quality > CONFIDENCE_THRESHOLDS.LOW) {
      validFields++;
      weightedConfidence += quality * fieldWeight;
      totalWeight += fieldWeight;
    }
  }

  let confidence = totalWeight > 0 ? weightedConfidence / totalWeight : 0;
  confidence = Number.isFinite(confidence) ? confidence : 0;

  return {
    confidence,
    validFields,
    totalFields
  };
}

// Aktualizujemy funkcję calculateAverageConfidence
export function calculateAverageConfidence(sections: DocumentSections): {
  confidence: number;
  validFields: number;
  totalFields: number;
  sectionConfidences: Record<string, { confidence: number; validFields: number; totalFields: number }>;
} {
  const sectionConfidences: Record<string, { confidence: number; validFields: number; totalFields: number }> = {};
  let totalWeightedConfidence = 0;
  let totalWeight = 0;
  let totalValidFields = 0;
  let totalFields = 0;

  // Oblicz pewność dla każdej sekcji
  for (const [sectionName, definition] of Object.entries(requiredFields)) {
    const sectionData = sections[sectionName as keyof DocumentSections];
    const result = calculateSectionConfidence(sectionData, definition);
    
    if (result.totalFields > 0) {
      sectionConfidences[sectionName] = result;
      const sectionWeight = defaultWeights[sectionName as keyof SectionWeights] || 0;

      if (result.confidence > 0) {
        totalWeightedConfidence += result.confidence * sectionWeight;
        totalWeight += sectionWeight;
      }

      totalValidFields += result.validFields;
      totalFields += result.totalFields;
    }
  }

  const finalConfidence = totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0;

  return {
    confidence: Number.isFinite(finalConfidence) ? finalConfidence : 0,
    validFields: totalValidFields,
    totalFields,
    sectionConfidences
  };
}

// Aktualizujemy definicję requiredFields z nowym typem
const requiredFields: RequiredFields = {
  ppe: {
    required: ['ppeNum', 'TariffGroup', 'dpStreet', 'dpBuilding', 'dpPostalCode', 'dpCity'],
    optional: ['MeterNumber', 'dpUnit', 'dpMunicipality', 'dpDistrict', 'dpProvince'],
    alternatives: {
      'ppeNum': ['PPENumber', 'PointNumber'],
      'TariffGroup': ['Tariff', 'TariffName']
    }
  },
  customer: {
    required: ['Street', 'Building', 'PostalCode', 'City'],
    optional: ['Unit', 'Municipality', 'District', 'Province'],
    alternatives: {
      'FirstName': ['BusinessName'],
      'LastName': ['taxID']
    }
  },
  correspondence: {
    required: ['paStreet', 'paBuilding', 'paPostalCode', 'paCity'],
    optional: ['paUnit', 'paMunicipality', 'paDistrict', 'paProvince'],
    alternatives: {
      'paFirstName': ['paBusinessName'],
      'paLastName': ['paTaxID']
    }
  },
  supplier: {
    required: ['supplierName', 'OSD_name'],
    optional: ['OSD_region', 'supplierTaxID', 'supplierStreet', 'supplierBuilding', 'supplierPostalCode', 'supplierCity', 'supplierBankAccount', 'supplierBankName', 'supplierEmail', 'supplierPhone', 'supplierWebsite'],
    alternatives: {}
  },
  billing: {
    required: ['billingStartDate', 'billingEndDate', 'billedUsage'],
    optional: ['usage12m'],
    alternatives: {}
  }
};

// Interfejs dla metryk wydajności
interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  operation: string;
  details?: Record<string, number>;
}

// Klasa do monitorowania wydajności
class PerformanceMonitor {
  private static metrics: PerformanceMetrics[] = [];
  private static enabled = true;

  static start(operation: string): number {
    if (!this.enabled) return 0;
    return performance.now();
  }

  static end(operation: string, startTime: number, details?: Record<string, number>) {
    if (!this.enabled || !startTime) return;
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics.push({
      startTime,
      endTime,
      duration,
      operation,
      details
    });

    // Log tylko dla długich operacji (>100ms)
    if (duration > 100) {
      console.warn(`Długa operacja: ${operation} (${duration.toFixed(2)}ms)`, details);
    }
  }

  static getMetrics(): PerformanceMetrics[] {
    return this.metrics;
  }

  static clear(): void {
    this.metrics = [];
  }

  static disable(): void {
    this.enabled = false;
  }

  static enable(): void {
    this.enabled = true;
  }
}

// Zoptymalizowana funkcja obliczająca kompletność dokumentu
export function calculateDocumentCompleteness(sections: DocumentSections): {
  completeness: number;
  sectionCompleteness: Record<string, number>;
  validFields: number;
  totalFields: number;
  metrics?: PerformanceMetrics[];
} {
  const totalStart = PerformanceMonitor.start('calculateDocumentCompleteness');
  
  // Wyczyść cache przed rozpoczęciem nowych obliczeń
  normalizedContentCache.clear();
  fieldValueCache.clear();

  const sectionCompleteness: Record<string, number> = {};
  let totalWeightedCompleteness = 0;
  let totalWeight = 0;
  let totalValidFields = 0;
  let totalFields = 0;

  // Pre-oblicz wartości dla często używanych operacji
  const sectionEntries = Object.entries(requiredFields);
  const sectionCount = sectionEntries.length;
  
  // Przygotuj tablicę wyników o znanym rozmiarze
  const sectionResults = new Array(sectionCount);
  
  // Przetwarzaj sekcje
  const processStart = PerformanceMonitor.start('processSections');
  
  for (let i = 0; i < sectionCount; i++) {
    const [section, definition] = sectionEntries[i];
    const sectionStart = PerformanceMonitor.start(`processSection:${section}`);
    
    const sectionData = sections[section as keyof DocumentSections];
    if (!sectionData) {
      sectionResults[i] = {
        section,
        completeness: 0,
        validFields: 0,
        totalFields: definition.required.length + definition.optional.length
      };
      continue;
    }

    // Deduplikuj dane sekcji
    const deduplicateStart = PerformanceMonitor.start('deduplicateFields');
    const deduplicatedData = deduplicateFields(sectionData);
    PerformanceMonitor.end('deduplicateFields', deduplicateStart);

    // Pre-oblicz wartości dla sekcji
    const requiredLength = definition.required.length;
    const optionalLength = definition.optional.length;
    
    // Oblicz wypełnienie pól
    const validateStart = PerformanceMonitor.start('validateFields');
    let filledRequired = 0;
    let filledOptional = 0;

    // Sprawdź pola wymagane
    for (let j = 0; j < requiredLength; j++) {
      if (hasFieldValue(deduplicatedData, definition.required[j], definition.alternatives[definition.required[j]])) {
        filledRequired++;
      }
    }

    // Sprawdź pola opcjonalne
    for (let j = 0; j < optionalLength; j++) {
      if (hasFieldValue(deduplicatedData, definition.optional[j], definition.alternatives[definition.optional[j]])) {
        filledOptional++;
      }
    }
    PerformanceMonitor.end('validateFields', validateStart);

    const requiredCompleteness = filledRequired / requiredLength;
    const optionalCompleteness = optionalLength > 0 ? filledOptional / optionalLength : 1;

    const sectionCompletenessValue = 
      (requiredCompleteness * 0.7) + 
      (optionalCompleteness * 0.3);

    // Sprawdź wymagane pola tylko jeśli sekcja ma jakąś wartość
    const requiredFieldsComplete = sectionCompletenessValue > 0 && filledRequired === requiredLength;

    sectionResults[i] = {
      section,
      completeness: requiredFieldsComplete ? sectionCompletenessValue : sectionCompletenessValue * 0.8,
      validFields: filledRequired + filledOptional,
      totalFields: requiredLength + optionalLength
    };

    PerformanceMonitor.end(`processSection:${section}`, sectionStart, {
      requiredFields: requiredLength,
      optionalFields: optionalLength,
      filledRequired,
      filledOptional
    });
  }

  PerformanceMonitor.end('processSections', processStart);

  // Agreguj wyniki
  const aggregateStart = PerformanceMonitor.start('aggregateResults');
  
  for (const result of sectionResults) {
    sectionCompleteness[result.section] = result.completeness;
    
    const sectionWeight = defaultWeights[result.section as keyof SectionWeights] || 0;
    totalWeightedCompleteness += result.completeness * sectionWeight;
    totalWeight += sectionWeight;
    
    totalValidFields += result.validFields;
    totalFields += result.totalFields;
  }

  PerformanceMonitor.end('aggregateResults', aggregateStart);

  const finalCompleteness = totalWeight > 0 ? totalWeightedCompleteness / totalWeight : 0;

  PerformanceMonitor.end('calculateDocumentCompleteness', totalStart);

  return {
    completeness: Number.isFinite(finalCompleteness) ? finalCompleteness : 0,
    sectionCompleteness,
    validFields: totalValidFields,
    totalFields,
    metrics: PerformanceMonitor.getMetrics()
  };
}

// Eksportuj monitor wydajności do użycia w innych modułach
export const performanceMonitor = PerformanceMonitor; 