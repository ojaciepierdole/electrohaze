import type { DocumentField } from '@/types/document-processing';
import type { SupplierData, CustomerData, PPEData, CorrespondenceData, BillingData } from '@/types/fields';
import { formatStreet } from './text-formatting/address';
import { splitAddressLine } from './text-formatting/address';
import { splitPersonName } from './text-formatting/person';

// Typy sekcji dokumentu
export type DocumentSection = 'ppe' | 'correspondence' | 'supplier' | 'billing' | 'customer';

// Typ dla danych wejściowych
export type SectionData = 
  | PPEData 
  | CorrespondenceData 
  | SupplierData 
  | CustomerData 
  | BillingData;

// Interfejs dla reguł przetwarzania
interface ProcessingRules {
  [key: string]: (value: string) => string;
}

// Funkcja do czyszczenia tekstu ze znaków specjalnych
function cleanSpecialCharacters(value: string): string {
  if (!value) return '';
  
  // Usuń znaki specjalne ale zachowaj polskie znaki
  return value
    .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ-]/g, '') // usuń wszystkie znaki specjalne oprócz myślnika i polskich znaków
    .replace(/\s+/g, ' ') // zamień wielokrotne spacje na pojedynczą
    .trim(); // usuń białe znaki z początku i końca
}

// Funkcja do przetwarzania imienia i nazwiska
function normalizePersonName(value: string) {
  // Sprawdź czy wartość istnieje
  if (!value) return { firstName: '', lastName: '' };
  
  // Wyczyść tekst ze znaków specjalnych
  const cleaned = cleanSpecialCharacters(value);
  const parts = cleaned.split(/\s+/);
  
  // Jeśli mamy tylko jedną część, traktujemy ją jako nazwisko
  if (parts.length === 1) {
    return {
      firstName: '',
      lastName: parts[0]
    };
  }
  
  // Jeśli mamy więcej części, pierwsza jest imieniem, reszta nazwiskiem
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

// Funkcja do rozdzielania numeru budynku i lokalu
function splitBuildingNumber(value: string, isUnit = false): { building: string; unit: string | null } {
  if (!value) return { building: '', unit: null };
  
  console.log('[splitBuildingNumber] Wejście:', value, 'isUnit:', isUnit);
  
  // Usuń białe znaki
  const cleaned = value.trim();
  
  // Jeśli to pole typu "unit", traktuj wartość jako numer lokalu
  if (isUnit) {
    console.log('[splitBuildingNumber] Traktuję jako numer lokalu:', cleaned);
    return { building: '', unit: cleaned };
  }
  
  // Sprawdź czy mamy ukośnik
  if (cleaned.includes('/')) {
    const [buildingPart, unitPart] = cleaned.split('/');
    const buildingMatch = buildingPart.match(/^(\d+)([A-Za-z])?$/);
    if (buildingMatch) {
      const building = buildingMatch[2] ? `${buildingMatch[1]}${buildingMatch[2]}` : buildingMatch[1];
      console.log('[splitBuildingNumber] Wynik z ukośnikiem:', { building, unit: unitPart });
      return { building, unit: unitPart };
    }
  }
  
  // Sprawdź czy to sam numer budynku z literą
  const buildingMatch = cleaned.match(/^(\d+)([A-Za-z])?$/);
  if (buildingMatch) {
    const building = buildingMatch[2] ? `${buildingMatch[1]}${buildingMatch[2]}` : buildingMatch[1];
    console.log('[splitBuildingNumber] Wynik bez ukośnika:', { building, unit: null });
    return { building, unit: null };
  }
  
  // Jeśli nie pasuje do żadnego formatu, zwróć całość jako numer budynku
  console.log('[splitBuildingNumber] Wynik domyślny:', { building: cleaned, unit: null });
  return { building: cleaned, unit: null };
}

// Funkcja do przetwarzania adresu
function normalizeAddress(value: string) {
  if (!value) return { street: '', building: null, unit: null };
  
  // Wyczyść tekst ze znaków specjalnych
  const cleaned = cleanSpecialCharacters(value);
  
  // Najpierw spróbuj rozdzielić ulicę od numeru
  const addressParts = cleaned.split(/\s+(?=\d)/);
  
  if (addressParts.length > 1) {
    // Mamy ulicę i numer
    const street = addressParts[0];
    const numberPart = addressParts.slice(1).join(' ');
    const { building, unit } = splitBuildingNumber(numberPart);
    
    return {
      street: formatStreet(street),
      building,
      unit
    };
  } else {
    // Sprawdź czy to sam numer budynku
    const { building, unit } = splitBuildingNumber(cleaned);
    
    return {
      street: '',
      building,
      unit
    };
  }
}

// Reguły przetwarzania dla każdej sekcji
const sectionRules: Record<DocumentSection, ProcessingRules> = {
  ppe: {
    dpStreet: (value) => {
      console.log('[dpStreet] Przetwarzanie:', value);
      const result = normalizeAddress(value);
      console.log('[dpStreet] Wynik:', result);
      return result.street || value;
    },
    dpBuilding: (value) => {
      console.log('[dpBuilding] Przetwarzanie:', value);
      const result = splitBuildingNumber(value, false);
      console.log('[dpBuilding] Wynik:', result);
      return result.building || value;
    },
    dpUnit: (value) => {
      console.log('[dpUnit] Przetwarzanie:', value);
      const result = splitBuildingNumber(value, true);
      console.log('[dpUnit] Wynik:', result);
      return result.unit || value;
    },
    dpPostalCode: (value) => value?.replace(/\s+/g, '').match(/\d{2}-\d{3}/) ? value : value?.replace(/(\d{2})(\d{3})/, '$1-$2'),
    dpCity: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    dpMunicipality: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    dpDistrict: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    dpProvince: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    MeterNumber: (value) => cleanSpecialCharacters(value)?.trim(),
    Tariff: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    ContractNumber: (value) => cleanSpecialCharacters(value)?.trim(),
    ContractType: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    ppeNum: (value) => value?.replace(/\s+/g, '')
  },
  correspondence: {
    paStreet: (value) => normalizeAddress(value).street || value,
    paBuilding: (value) => normalizeAddress(value).building || value,
    paUnit: (value) => normalizeAddress(value).unit || value,
    paFirstName: (value) => {
      const name = normalizePersonName(value);
      return cleanSpecialCharacters(name.firstName || value);
    },
    paLastName: (value) => {
      const name = normalizePersonName(value);
      return cleanSpecialCharacters(name.lastName || value);
    },
    paPostalCode: (value) => value?.replace(/\s+/g, '').match(/\d{2}-\d{3}/) ? value : value?.replace(/(\d{2})(\d{3})/, '$1-$2'),
    paCity: (value) => cleanSpecialCharacters(value)?.toUpperCase()
  },
  supplier: {
    supplierStreet: (value) => normalizeAddress(value).street || value,
    supplierBuilding: (value) => normalizeAddress(value).building || value,
    supplierUnit: (value) => normalizeAddress(value).unit || value,
  },
  customer: {
    FirstName: (value) => {
      const name = normalizePersonName(value);
      return cleanSpecialCharacters(name.firstName || value);
    },
    LastName: (value) => {
      const name = normalizePersonName(value);
      return cleanSpecialCharacters(name.lastName || value);
    },
    Street: (value) => normalizeAddress(value).street || value,
    Building: (value) => {
      const result = splitBuildingNumber(value, false);
      return result.building || value;
    },
    Unit: (value) => {
      const result = splitBuildingNumber(value, true);
      return result.unit || value;
    },
    PostalCode: (value) => value?.replace(/\s+/g, '').match(/\d{2}-\d{3}/) ? value : value?.replace(/(\d{2})(\d{3})/, '$1-$2'),
    City: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    Municipality: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    District: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    Province: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    BusinessName: (value) => cleanSpecialCharacters(value)?.toUpperCase(),
    taxID: (value) => value?.replace(/[^\d]/g, '')
  },
  billing: {} // Brak specjalnych reguł dla sekcji billing
};

// Główna funkcja przetwarzająca sekcję
export function processSection<T extends Record<string, DocumentField> & Partial<PPEData>>(
  section: DocumentSection,
  data: T
): T {
  const rules = sectionRules[section];
  const result = { ...data } as T;

  console.log(`[processSection] Przetwarzanie sekcji ${section}:`, {
    inputFields: Object.keys(data),
    availableRules: Object.keys(rules)
  });

  // Specjalna obsługa dla sekcji PPE gdy dpBuilding lub dpUnit zawiera pełny format adresu
  if (section === 'ppe') {
    // Sprawdź dpBuilding
    if ('dpBuilding' in data && data.dpBuilding?.content) {
      const parts = data.dpBuilding.content.split('/');
      if (parts.length === 2) {
        // Mamy format "budynek/lokal" w dpBuilding
        console.log('[processSection] Znaleziono format budynek/lokal w dpBuilding:', parts);
        
        // Aktualizuj dpBuilding tylko numerem budynku
        result.dpBuilding = {
          ...data.dpBuilding,
          content: parts[0],
          confidence: data.dpBuilding.confidence
        };

        // Dodaj dpUnit jeśli nie istnieje lub jest puste
        if (!result.dpUnit?.content) {
          result.dpUnit = {
            content: parts[1],
            confidence: data.dpBuilding.confidence * 0.9,
            boundingRegions: data.dpBuilding.boundingRegions,
            spans: data.dpBuilding.spans
          };
          console.log('[processSection] Utworzono pole dpUnit z dpBuilding:', parts[1]);
        }
      }
    }

    // Sprawdź dpUnit
    if ('dpUnit' in data && data.dpUnit?.content) {
      const parts = data.dpUnit.content.split('/');
      if (parts.length === 2) {
        // Mamy format "budynek/lokal" w dpUnit
        console.log('[processSection] Znaleziono format budynek/lokal w dpUnit:', parts);
        
        // Aktualizuj dpUnit tylko numerem lokalu
        result.dpUnit = {
          ...data.dpUnit,
          content: parts[1],
          confidence: data.dpUnit.confidence * 0.9
        };

        // Dodaj lub zaktualizuj dpBuilding jeśli jest pusty lub ma niższą pewność
        if (!result.dpBuilding?.content || 
            (result.dpBuilding.confidence < data.dpUnit.confidence)) {
          result.dpBuilding = {
            content: parts[0],
            confidence: data.dpUnit.confidence,
            boundingRegions: data.dpUnit.boundingRegions,
            spans: data.dpUnit.spans
          };
          console.log('[processSection] Utworzono/zaktualizowano pole dpBuilding z dpUnit:', parts[0]);
        }
      }
    }
  }

  // Przetwarzamy wszystkie pola
  for (const [key, field] of Object.entries(result)) {
    // Jeśli pole nie istnieje lub nie ma wartości, pomijamy je
    if (!field?.content) {
      console.log(`[processSection] Pomijam puste pole ${key}`);
      continue;
    }

    // Jeśli istnieje reguła dla tego pola
    if (rules[key]) {
      try {
        console.log(`[processSection] Przetwarzam pole ${key}:`, {
          originalValue: field.content,
          confidence: field.confidence
        });

        const processedValue = rules[key](field.content);
        if (processedValue !== field.content) {
          const processedField: DocumentField = {
            ...field,
            content: processedValue,
            confidence: field.confidence * 0.9 // Zmniejszamy pewność po przetworzeniu
          };
          result[key as keyof T] = processedField as T[keyof T];

          console.log(`[processSection] Pole ${key} przetworzone:`, {
            newValue: processedValue,
            newConfidence: processedField.confidence
          });
        }
      } catch (error) {
        console.error(`[processSection] Błąd przetwarzania pola ${key} w sekcji ${section}:`, error);
        // Zachowujemy oryginalne dane w przypadku błędu
      }
    } else {
      console.log(`[processSection] Brak reguły dla pola ${key}`);
    }
  }

  return result;
} 