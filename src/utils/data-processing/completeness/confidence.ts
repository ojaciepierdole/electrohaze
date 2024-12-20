import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField, GroupConfidence, DocumentConfidence } from '@/types/processing';
import { FIELD_GROUPS } from '@/config/fields';

export interface DocumentSections {
  [key: string]: Record<string, DocumentField> | undefined;
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
function getFieldQuality(field: DocumentField | undefined): number {
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

// Oblicza kompletność grupy pól
export function calculateGroupCompleteness(
  fields: Record<string, DocumentField> | undefined,
  groupKey: string
): GroupConfidence {
  if (!fields) {
    return {
      completeness: 0,
      confidence: 0,
      filledRequired: 0,
      totalRequired: 0,
      filledOptional: 0,
      totalOptional: 0
    };
  }

  const fieldGroup = FIELD_GROUPS[groupKey as keyof typeof FIELD_GROUPS];
  if (!fieldGroup) {
    return {
      completeness: 0,
      confidence: 0,
      filledRequired: 0,
      totalRequired: 0,
      filledOptional: 0,
      totalOptional: 0
    };
  }

  const requiredFields = fieldGroup.requiredFields;
  const optionalFields = fieldGroup.fields.filter(field => !requiredFields.includes(field));

  const filledRequired = requiredFields.filter(fieldName => {
    const field = fields[fieldName];
    return field?.content;
  }).length;

  const filledOptional = optionalFields.filter(fieldName => {
    const field = fields[fieldName];
    return field?.content;
  }).length;

  // Oblicz średnią pewność dla wszystkich wypełnionych pól
  const filledFields = Object.values(fields).filter(field => field?.content);
  const confidence = filledFields.length > 0
    ? filledFields.reduce((sum, field) => sum + (field?.confidence || 0), 0) / filledFields.length
    : 0;

  // Oblicz kompletność jako średnią ważoną wymaganych i opcjonalnych pól
  const requiredWeight = 0.7; // Waga pól wymaganych
  const optionalWeight = 0.3; // Waga pól opcjonalnych

  const requiredCompleteness = requiredFields.length > 0
    ? filledRequired / requiredFields.length
    : 1;

  const optionalCompleteness = optionalFields.length > 0
    ? filledOptional / optionalFields.length
    : 1;

  const completeness = (requiredCompleteness * requiredWeight) + (optionalCompleteness * optionalWeight);

  return {
    completeness,
    confidence,
    filledRequired,
    totalRequired: requiredFields.length,
    filledOptional,
    totalOptional: optionalFields.length
  };
}

// Oblicza kompletność całego dokumentu
export function calculateDocumentCompleteness(sections: DocumentSections): DocumentConfidence {
  const documentConfidence: DocumentConfidence = {
    overall: 0,
    confidence: 0,
    groups: {
      delivery_point: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      ppe: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      postal_address: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      buyer_data: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      supplier: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      consumption_info: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      billing: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 }
    }
  };

  // Oblicz kompletność dla każdej grupy
  for (const [groupKey, fields] of Object.entries(sections)) {
    if (groupKey in documentConfidence.groups) {
      documentConfidence.groups[groupKey as keyof typeof documentConfidence.groups] = 
        calculateGroupCompleteness(fields, groupKey);
    }
  }

  // Oblicz ogólną kompletność i pewność dokumentu
  const groupValues = Object.values(documentConfidence.groups);
  if (groupValues.length > 0) {
    const overallCompleteness = groupValues.reduce((sum, group) => sum + group.completeness, 0) / groupValues.length;
    const overallConfidence = groupValues.reduce((sum, group) => sum + group.confidence, 0) / groupValues.length;

    documentConfidence.overall = overallCompleteness;
    documentConfidence.confidence = overallConfidence;
  }

  return documentConfidence;
}

// Oblicza średnią pewność dla dokumentu
export function calculateAverageConfidence(sections: DocumentSections): DocumentConfidence {
  const documentConfidence: DocumentConfidence = {
    overall: 0,
    confidence: 0,
    groups: {
      delivery_point: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      ppe: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      postal_address: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      buyer_data: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      supplier: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      consumption_info: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 },
      billing: { completeness: 0, confidence: 0, filledRequired: 0, totalRequired: 0, filledOptional: 0, totalOptional: 0 }
    }
  };

  // Oblicz pewność dla każdej grupy
  for (const [groupKey, fields] of Object.entries(sections)) {
    if (groupKey in documentConfidence.groups && fields) {
      const groupFields = Object.values(fields);
      if (groupFields.length > 0) {
        const groupConfidence = groupFields.reduce((sum, field) => sum + (field?.confidence || 0), 0) / groupFields.length;
        documentConfidence.groups[groupKey as keyof typeof documentConfidence.groups].confidence = groupConfidence;
      }
    }
  }

  // Oblicz ogólną pewność dokumentu
  const groupValues = Object.values(documentConfidence.groups);
  if (groupValues.length > 0) {
    const overallConfidence = groupValues.reduce((sum, group) => sum + group.confidence, 0) / groupValues.length;
    documentConfidence.overall = overallConfidence;
    documentConfidence.confidence = overallConfidence;
  }

  return documentConfidence;
} 