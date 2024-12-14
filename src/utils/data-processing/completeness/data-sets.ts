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
    requiredFields: ['street', 'building', 'postalCode', 'city'],
    optionalFields: ['unit']
  },
  correspondence: {
    requiredFields: ['street', 'building', 'postalCode', 'city'],
    optionalFields: ['unit']
  },
  delivery: {
    requiredFields: ['street', 'building', 'postalCode', 'city'],
    optionalFields: ['unit']
  },
  supplier: {
    requiredFields: ['street', 'building', 'postalCode', 'city'],
    optionalFields: ['unit']
  }
};

export function checkAddressCompleteness(
  addresses: Record<DataSection, NormalizedAddress>
): Record<DataSection, DataSetCompleteness> {
  const result: Record<DataSection, DataSetCompleteness> = {} as Record<DataSection, DataSetCompleteness>;

  Object.entries(addresses).forEach(([section, address]) => {
    const sectionKey = section as DataSection;
    const requirements = REQUIREMENTS[sectionKey];

    const missingFields = [
      ...requirements.requiredFields.filter(field => !address[field as keyof NormalizedAddress]),
      ...requirements.optionalFields.filter(field => !address[field as keyof NormalizedAddress])
    ];

    const totalFields = requirements.requiredFields.length + requirements.optionalFields.length;
    const filledFields = totalFields - missingFields.length;
    const hasRequiredFields = requirements.requiredFields.every(field => 
      address[field as keyof NormalizedAddress] !== null
    );

    result[sectionKey] = {
      completeness: filledFields / totalFields,
      missingFields,
      hasRequiredFields,
      confidence: address.confidence
    };
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