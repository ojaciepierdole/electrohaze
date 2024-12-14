import { NormalizedAddress, NormalizedPerson, DataSection } from '../types';

interface DataSetCompleteness {
  completeness: number;
  missingFields: string[];
  hasRequiredFields: boolean;
  confidence: number;
}

interface DataSetRequirements {
  requiredFields: string[];
  optionalFields: string[];
}

const REQUIREMENTS: Record<DataSection, DataSetRequirements> = {
  ppe: {
    requiredFields: ['dpStreet', 'dpBuilding', 'dpPostalCode', 'dpCity', 'dpFirstName', 'dpLastName'],
    optionalFields: ['dpUnit', 'dpMunicipality', 'dpDistrict', 'dpProvince']
  },
  correspondence: {
    requiredFields: ['paStreet', 'paBuilding', 'paPostalCode', 'paCity', 'paFirstName', 'paLastName'],
    optionalFields: ['paUnit', 'paMunicipality', 'paDistrict', 'paProvince', 'paTitle', 'paBusinessName']
  },
  supplier: {
    requiredFields: ['supplierStreet', 'supplierBuilding', 'supplierPostalCode', 'supplierCity', 'supplierName', 'supplierTaxID'],
    optionalFields: ['supplierUnit', 'supplierBankAccount', 'supplierBankName', 'supplierEmail', 'supplierPhone', 'supplierWebsite']
  },
  delivery: {
    requiredFields: ['dpStreet', 'dpBuilding', 'dpPostalCode', 'dpCity', 'dpFirstName', 'dpLastName'],
    optionalFields: ['dpUnit', 'dpMunicipality', 'dpDistrict', 'dpProvince']
  }
};

function isFieldEmpty(value: any): boolean {
  if (value && typeof value === 'object' && 'content' in value) {
    return isFieldEmpty(value.content);
  }
  
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

export function checkAddressCompleteness(
  addresses: Record<DataSection, NormalizedAddress>
): Record<DataSection, DataSetCompleteness> {
  const result: Record<DataSection, DataSetCompleteness> = {} as Record<DataSection, DataSetCompleteness>;

  Object.entries(addresses).forEach(([section, address]) => {
    const sectionKey = section as DataSection;
    const requirements = REQUIREMENTS[sectionKey];

    console.log(`[checkAddressCompleteness] Sprawdzanie sekcji ${sectionKey}:`, {
      address: JSON.stringify(address, null, 2),
      requirements
    });

    // Sprawdzanie wymaganych pól
    const missingRequiredFields = requirements.requiredFields.filter(field => {
      const value = address[field as keyof NormalizedAddress];
      const isEmpty = isFieldEmpty(value);
      console.log(`[checkAddressCompleteness] Sprawdzanie wymaganego pola ${field}:`, {
        field,
        value: JSON.stringify(value),
        isEmpty,
        type: typeof value,
        hasField: field in address
      });
      return isEmpty;
    });

    // Sprawdzanie opcjonalnych pól - tylko jeśli pole istnieje w danych
    const missingOptionalFields = requirements.optionalFields.filter(field => {
      const value = address[field as keyof NormalizedAddress];
      // Jeśli pole nie istnieje w danych, nie traktujemy go jako brakujące
      if (!(field in address)) {
        console.log(`[checkAddressCompleteness] Pole opcjonalne ${field} nie istnieje w danych`);
        return false;
      }
      const isEmpty = isFieldEmpty(value);
      console.log(`[checkAddressCompleteness] Sprawdzanie opcjonalnego pola ${field}:`, {
        value: JSON.stringify(value),
        isEmpty,
        type: typeof value,
        exists: field in address
      });
      return isEmpty;
    });

    // Obliczanie kompletności tylko dla wymaganych pól i istniejących opcjonalnych
    const existingOptionalFields = requirements.optionalFields.filter(field => field in address);
    const totalFields = requirements.requiredFields.length + existingOptionalFields.length;
    const filledFields = totalFields - (missingRequiredFields.length + missingOptionalFields.length);
    const hasRequiredFields = missingRequiredFields.length === 0;

    const completenessResult = {
      completeness: filledFields / totalFields,
      missingFields: [...missingRequiredFields, ...missingOptionalFields],
      hasRequiredFields,
      confidence: address.confidence
    };

    console.log(`[checkAddressCompleteness] Wynik dla sekcji ${sectionKey}:`, {
      ...completenessResult,
      filledFields,
      totalFields,
      existingOptionalFields,
      missingRequiredFields,
      missingOptionalFields
    });

    result[sectionKey] = completenessResult;
  });

  return result;
}

export function findMostCompleteDataSet(
  completeness: Record<DataSection, DataSetCompleteness>
): DataSection | null {
  let bestSection: DataSection | null = null;
  let bestScore = -1;

  Object.entries(completeness).forEach(([section, data]) => {
    const score = calculateDataSetScore(data);
    if (score > bestScore) {
      bestScore = score;
      bestSection = section as DataSection;
    }
  });

  return bestSection;
}

function calculateDataSetScore(data: DataSetCompleteness): number {
  // Wagi dla różnych aspektów kompletności danych
  const COMPLETENESS_WEIGHT = 0.4;
  const REQUIRED_FIELDS_WEIGHT = 0.4;
  const CONFIDENCE_WEIGHT = 0.2;

  return (
    data.completeness * COMPLETENESS_WEIGHT +
    (data.hasRequiredFields ? 1 : 0) * REQUIRED_FIELDS_WEIGHT +
    data.confidence * CONFIDENCE_WEIGHT
  );
}

export function suggestCrossFilling(
  addresses: Record<DataSection, NormalizedAddress>,
  completeness: Record<DataSection, DataSetCompleteness>
): Map<string, { fromSection: DataSection; toSection: DataSection; field: string }[]> {
  const suggestions = new Map<string, { fromSection: DataSection; toSection: DataSection; field: string }[]>();

  // Znajdź najbardziej kompletny zestaw danych
  const mostCompleteSection = findMostCompleteDataSet(completeness);
  if (!mostCompleteSection) return suggestions;

  const referenceAddress = addresses[mostCompleteSection];

  // Sprawdź każdą sekcję pod kątem możliwości uzupełnienia
  Object.entries(addresses).forEach(([section, address]) => {
    const sectionKey = section as DataSection;
    if (sectionKey === mostCompleteSection) return;

    const sectionCompleteness = completeness[sectionKey];
    
    // Sprawdź każde brakujące pole
    sectionCompleteness.missingFields.forEach(field => {
      const fieldKey = field as keyof NormalizedAddress;
      
      if (referenceAddress[fieldKey]) {
        const key = `${sectionKey}_${field}`;
        if (!suggestions.has(key)) {
          suggestions.set(key, []);
        }
        suggestions.get(key)?.push({
          fromSection: mostCompleteSection,
          toSection: sectionKey,
          field
        });
      }
    });
  });

  return suggestions;
} 