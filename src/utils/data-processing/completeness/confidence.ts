import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField } from '@/types/document';

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

  const requiredFields = [
    prefix + 'Street',
    prefix + 'Building',
    prefix + 'PostalCode',
    prefix + 'City'
  ];

  return requiredFields.every(field => {
    const value = data[field]?.content;
    return value !== undefined && value !== null && value !== '';
  });
}

// Sprawdza czy dane osobowe są kompletne
function isPersonalDataComplete(data: Record<string, DocumentField> | undefined, prefix: string = ''): boolean {
  if (!data) return false;

  const requiredFields = [
    prefix + 'FirstName',
    prefix + 'LastName'
  ];

  return requiredFields.every(field => {
    const value = data[field]?.content;
    return value !== undefined && value !== null && value !== '';
  });
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
  const ppeNum = sections.ppe?.ppeNum?.content;
  const tariffGroup = sections.ppe?.TariffGroup?.content || sections.ppe?.Tariff?.content;
  
  const hasPPEData = Boolean(ppeNum && tariffGroup);
  
  console.log('Debug calculateUsability:', {
    ppeNum,
    tariffGroup,
    hasPPEData
  });

  // 2. Wymagane dane osobowe klienta
  const hasCustomerData = isPersonalDataComplete(sections.customer);
  
  console.log('Customer data:', {
    hasCustomerData,
    customerFields: sections.customer
  });

  // 3. Wymagany kompletny adres
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

  // Dokument jest przydatny tylko jeśli ma wszystkie wymagane dane
  const isUsable = hasPPEData && hasCustomerData && hasValidAddress;
  
  console.log('Final usability:', {
    isUsable,
    conditions: {
      hasPPEData,
      hasCustomerData,
      hasValidAddress
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
  // PPE
  'ppeNum': 1.0,
  'MeterNumber': 0.8,
  'TariffGroup': 0.8,
  
  // Dane osobowe
  'FirstName': 0.9,
  'LastName': 0.9,
  'BusinessName': 0.9,
  'taxID': 0.8,
  
  // Adres
  'Street': 0.7,
  'Building': 0.7,
  'PostalCode': 0.6,
  'City': 0.6,
  'Unit': 0.3,
  
  // Dostawca
  'supplierName': 0.8,
  'supplierTaxID': 0.7,
  'OSD_name': 0.7,
  'OSD_region': 0.6,
  
  // Rozliczenia
  'billingStartDate': 0.5,
  'billingEndDate': 0.5,
  'billedUsage': 0.7,
  '12mUsage': 0.6
};

const defaultWeights: SectionWeights = {
  ppe: 0.3,
  customer: 0.25,
  correspondence: 0.15,
  supplier: 0.2,
  billing: 0.1
};

// Funkcja do obliczania kompletności sekcji z uwzględnieniem wag pól
function calculateSectionCompleteness(
  data: Record<string, DocumentField | undefined> | undefined, 
  requiredFields: string[]
): number {
  if (!data) return 0;

  let totalWeight = 0;
  let weightedSum = 0;

  for (const field of requiredFields) {
    const fieldWeight = fieldWeights[field] || 0.5;
    totalWeight += fieldWeight;

    const value = data[field]?.content;
    if (value !== undefined && value !== null && value !== '') {
      weightedSum += fieldWeight;
    }
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// Wymagane pola dla każdej sekcji
const requiredFields = {
  ppe: ['ppeNum', 'MeterNumber', 'TariffGroup', 'dpStreet', 'dpBuilding', 'dpPostalCode', 'dpCity'],
  customer: ['FirstName', 'LastName', 'Street', 'Building', 'PostalCode', 'City'],
  correspondence: ['paFirstName', 'paLastName', 'paStreet', 'paBuilding', 'paPostalCode', 'paCity'],
  supplier: ['supplierName', 'supplierTaxID', 'supplierStreet', 'supplierBuilding', 'supplierPostalCode', 'supplierCity', 'OSD_name', 'OSD_region'],
  billing: ['billingStartDate', 'billingEndDate', 'billedUsage']
};

// Funkcja do obliczania kompletności dokumentu
export function calculateDocumentCompleteness(sections: DocumentSections, weights: Partial<SectionWeights> = {}): number {
  const finalWeights = { ...defaultWeights, ...weights };
  let totalWeight = 0;
  let weightedCompleteness = 0;

  // Oblicz kompletność dla każdej sekcji
  for (const [section, fields] of Object.entries(requiredFields)) {
    const sectionData = sections[section as keyof DocumentSections];
    const sectionWeight = finalWeights[section as keyof SectionWeights];
    
    if (sectionWeight > 0) {
      const completeness = calculateSectionCompleteness(sectionData, fields);
      weightedCompleteness += completeness * sectionWeight;
      totalWeight += sectionWeight;
    }
  }

  // Jeśli nie ma żadnych wag, zwróć 0
  if (totalWeight === 0) return 0;

  // Zwróć średnią ważoną
  return weightedCompleteness / totalWeight;
}

// Funkcja do obliczania średniej pewności ze wszystkich pól
export function calculateAverageConfidence(sections: DocumentSections): number {
  let totalWeightedConfidence = 0;
  let totalWeight = 0;

  // Funkcja pomocnicza do przetwarzania sekcji
  const processSection = (data: Record<string, DocumentField | undefined> | undefined) => {
    if (!data) return;
    
    Object.entries(data).forEach(([fieldName, field]) => {
      if (field?.confidence !== undefined) {
        const fieldWeight = fieldWeights[fieldName] || 0.5;
        totalWeightedConfidence += field.confidence * fieldWeight;
        totalWeight += fieldWeight;
      }
    });
  };

  // Przetwórz wszystkie sekcje
  processSection(sections.ppe);
  processSection(sections.customer);
  processSection(sections.correspondence);
  processSection(sections.supplier);
  processSection(sections.billing);

  return totalWeight > 0 ? totalWeightedConfidence / totalWeight : 0;
} 