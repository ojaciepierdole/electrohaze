import type { PPEData, CustomerData, CorrespondenceData, SupplierData, BillingData } from '@/types/fields';
import type { DocumentField } from '@/types/document-processing';

interface DocumentSections {
  ppe?: Partial<PPEData>;
  customer?: Partial<CustomerData>;
  correspondence?: Partial<CorrespondenceData>;
  supplier?: Partial<SupplierData>;
  billing?: Partial<BillingData>;
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

// Sprawdza czy dokument jest przydatny (ma wszystkie wymagane pola do podpisania umowy)
export function calculateUsability(sections: DocumentSections): boolean {
  // Sprawdź czy mamy numer PPE
  const hasPPENumber = sections.ppe?.ppeNum?.content;
  
  // Sprawdź czy mamy taryfę
  const hasTariff = sections.ppe?.Tariff?.content;
  
  // Sprawdź czy mamy kompletny adres klienta lub korespondencyjny
  const hasCustomerAddress = isAddressComplete(sections.customer as Record<string, DocumentField>);
  const hasCorrespondenceAddress = isAddressComplete(sections.correspondence as Record<string, DocumentField>, 'pa');
  
  // Dokument jest przydatny jeśli ma numer PPE, taryfę i przynajmniej jeden kompletny adres
  return Boolean(
    hasPPENumber && 
    hasTariff && 
    (hasCustomerAddress || hasCorrespondenceAddress)
  );
}

interface SectionWeights {
  ppe: number;
  customer: number;
  correspondence: number;
  supplier: number;
  billing: number;
}

const defaultWeights: SectionWeights = {
  ppe: 0.3,
  customer: 0.2,
  correspondence: 0.1,
  supplier: 0.3,
  billing: 0.1
};

// Funkcja do obliczania kompletności sekcji
function calculateSectionCompleteness(data: Record<string, DocumentField | undefined> | undefined, requiredFields: string[]): number {
  if (!data) return 0;

  const filledFields = requiredFields.filter(field => {
    const value = data[field]?.content;
    return value !== undefined && value !== null && value !== '';
  });

  return filledFields.length / requiredFields.length;
}

// Wymagane pola dla każdej sekcji
const requiredFields = {
  ppe: ['ppeNum', 'MeterNumber', 'Tariff', 'dpStreet', 'dpBuilding', 'dpPostalCode', 'dpCity'],
  customer: ['FirstName', 'LastName', 'Street', 'Building', 'PostalCode', 'City'],
  correspondence: ['paFirstName', 'paLastName', 'paStreet', 'paBuilding', 'paPostalCode', 'paCity'],
  supplier: ['supplierName', 'spTaxID', 'spStreet', 'spBuilding', 'spPostalCode', 'spCity', 'OSD_name', 'OSD_region'],
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