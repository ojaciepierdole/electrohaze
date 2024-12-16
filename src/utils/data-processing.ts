import type { DocumentField, ProcessSectionInput, ProcessSectionContext } from '@/types/document-processing';
import type { SupplierData, CustomerData, PPEData, CorrespondenceData, BillingData } from '@/types/fields';
import { formatStreet } from './text-formatting/address';
import { splitAddressLine } from './text-formatting/address';
import { splitPersonName } from './text-formatting/person';
import { commonFirstNames } from './name-lists';

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

// Interfejs dla kontekstu przetwarzania
interface ProcessingContext {
  ppe?: Partial<PPEData>;
  customer?: Partial<CustomerData>;
  correspondence?: Partial<CorrespondenceData>;
}

// Funkcja do czyszczenia tekstu ze znaków specjalnych
function cleanSpecialCharacters(value: string): string {
  if (!value) return '';
  
  return value
    .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ' ') // usuń wszystkie znaki specjalne (w tym przecinki) zamieniając je na spacje
    .replace(/\s+/g, ' ')                         // zamień wielokrotne spacje na pojedynczą
    .trim()                                       // usuń białe znaki z początku i końca
    .toUpperCase();                               // konwertuj na wielkie litery
}

// Funkcja do normalizacji nazwy OSD
export function normalizeOSDName(value: string): string {
  if (!value) return '';
  
  const normalized = cleanSpecialCharacters(value);
  
  // Mapowanie typowych wariantów nazw OSD
  const osdMappings: Record<string, string> = {
    'ENERGA OPERATOR': 'ENERGA-OPERATOR',
    'PGE DYSTRYBUCJA': 'PGE DYSTRYBUCJA',
    'TAURON DYSTRYBUCJA': 'TAURON DYSTRYBUCJA',
    'ENEA OPERATOR': 'ENEA OPERATOR',
    'STOEN OPERATOR': 'STOEN OPERATOR',
    'INNOGY STOEN OPERATOR': 'STOEN OPERATOR'
  };
  
  for (const [variant, normalized] of Object.entries(osdMappings)) {
    if (value.toUpperCase().includes(variant)) {
      return normalized;
    }
  }
  
  return value;
}

// Funkcja do przetwarzania imienia i nazwiska
function processPersonName(firstName: string | null, lastName: string | null): { firstName: string | null; lastName: string | null } {
  if (!firstName && !lastName) return { firstName: null, lastName: null };
  
  // Jeśli mamy tylko jedno pole wypełnione
  if (!firstName || !lastName) {
    const singleName = (firstName || lastName || '').trim();
    const parts = singleName.split(/\s+/);
    
    // Jeśli mamy jedno słowo
    if (parts.length === 1) {
      // Sprawdź czy to imię czy nazwisko
      if (Array.from(commonFirstNames).some(name => name === parts[0].toUpperCase())) {
        return { firstName: parts[0], lastName: null };
      } else {
        return { firstName: null, lastName: parts[0] };
      }
    }
    
    // Jeśli mamy więcej słów
    const potentialFirstName = parts[0];
    const potentialLastName = parts.slice(1).join(' ');
    
    if (Array.from(commonFirstNames).some(name => name === potentialFirstName.toUpperCase())) {
      return { firstName: potentialFirstName, lastName: potentialLastName };
    } else {
      return { firstName: null, lastName: singleName };
    }
  }
  
  // Jeśli mamy oba pola
  return {
    firstName: firstName.trim(),
    lastName: lastName.trim()
  };
}

// Funkcja do normalizacji nazwy taryfy
function normalizeTariffGroup(value: string): string {
  if (!value) return '';
  
  const normalized = cleanSpecialCharacters(value);
  
  // Mapowanie typowych wariantów nazw taryf
  const tariffMappings: Record<string, string> = {
    'G 11': 'G11',
    'G 12': 'G12',
    'G 12W': 'G12W',
    'G 12R': 'G12R',
    'C 11': 'C11',
    'C 12A': 'C12A',
    'C 12B': 'C12B',
    'C 21': 'C21',
    'C 22A': 'C22A',
    'C 22B': 'C22B',
    'B 11': 'B11',
    'B 21': 'B21',
    'B 22': 'B22',
    'B 23': 'B23',
    'A 21': 'A21',
    'A 22': 'A22',
    'A 23': 'A23'
  };
  
  for (const [variant, standardized] of Object.entries(tariffMappings)) {
    if (normalized.includes(variant) || normalized.includes(variant.replace(' ', ''))) {
      return standardized;
    }
  }
  
  return value;
}

// Reguły przetwarzania dla poszczególnych pól
const fieldRules: ProcessingRules = {
  // Reguły dla adresów
  Street: (value) => formatStreet(value) || '',
  Building: (value) => cleanSpecialCharacters(value),
  Unit: (value) => cleanSpecialCharacters(value),
  PostalCode: (value) => value?.replace(/[^\d-]/g, '') || '',
  City: (value) => cleanSpecialCharacters(value),
  Municipality: (value) => cleanSpecialCharacters(value),
  District: (value) => cleanSpecialCharacters(value),
  Province: (value) => cleanSpecialCharacters(value),
  
  // Reguły dla numerów i identyfikatorów
  MeterNumber: (value) => cleanSpecialCharacters(value),
  ContractNumber: (value) => cleanSpecialCharacters(value),
  ppeNum: (value) => value?.replace(/[^\d]/g, ''),
  taxID: (value) => value?.replace(/[^\d]/g, ''),
  
  // Reguły dla pozostałych pól
  BusinessName: (value) => cleanSpecialCharacters(value),
  Tariff: (value) => normalizeTariffGroup(value),
  ContractType: (value) => cleanSpecialCharacters(value),
  OSD_name: (value) => normalizeOSDName(cleanSpecialCharacters(value)),
  
  // Reguły dla taryf
  TariffGroup: (value) => normalizeTariffGroup(value)
};

// Mapowanie nazw pól z różnych sekcji na standardowe nazwy
const fieldMappings: Record<string, string> = {
  // PPE
  dpStreet: 'Street',
  dpBuilding: 'Building',
  dpUnit: 'Unit',
  dpPostalCode: 'PostalCode',
  dpCity: 'City',
  dpMunicipality: 'Municipality',
  dpDistrict: 'District',
  dpProvince: 'Province',
  dpFirstName: 'FirstName',
  dpLastName: 'LastName',
  
  // Correspondence
  paStreet: 'Street',
  paBuilding: 'Building',
  paUnit: 'Unit',
  paPostalCode: 'PostalCode',
  paCity: 'City',
  paFirstName: 'FirstName',
  paLastName: 'LastName',
  
  // Supplier
  spStreet: 'Street',
  spBuilding: 'Building',
  spUnit: 'Unit',
  spPostalCode: 'PostalCode',
  spCity: 'City',
  spBusinessName: 'BusinessName'
};

// Pary pól, które powinny być przetwarzane razem
const fieldPairs = {
  FirstName: 'LastName',
  dpFirstName: 'dpLastName',
  paFirstName: 'paLastName'
};

// Główna funkcja przetwarzająca sekcję
export function processSection<T extends Record<string, DocumentField>>(
  section: DocumentSection,
  data: Partial<T>,
  context?: ProcessingContext
): Partial<T> {
  const result = { ...data } as Partial<T>;

  // Mapowanie starych nazw pól na nowe
  if (section === 'ppe' && 'Tariff' in data) {
    result['TariffGroup' as keyof T] = data['Tariff' as keyof T];
    delete result['Tariff' as keyof T];
  }

  // Zbiór przetworzonych pól
  const processedFields = new Set<string>();

  // Najpierw przetwarzamy pary imię-nazwisko
  for (const [firstNameField, lastNameField] of Object.entries(fieldPairs)) {
    // Sprawdź czy mamy oba pola w danych
    if (firstNameField in data && lastNameField in data) {
      const firstName = data[firstNameField]?.content;
      const lastName = data[lastNameField]?.content;

      if (firstName || lastName) {
        const processedName = processPersonName(
          firstName === undefined ? null : firstName,
          lastName === undefined ? null : lastName
        );
        
        // Aktualizuj pole imienia
        if (firstName !== processedName.firstName) {
          result[firstNameField as keyof T] = {
            ...data[firstNameField],
            content: processedName.firstName,
            confidence: (data[firstNameField]?.confidence || 1) * 0.9,
            isEnriched: true
          } as T[keyof T];
        }
        
        // Aktualizuj pole nazwiska
        if (lastName !== processedName.lastName) {
          result[lastNameField as keyof T] = {
            ...data[lastNameField],
            content: processedName.lastName,
            confidence: (data[lastNameField]?.confidence || 1) * 0.9,
            isEnriched: true
          } as T[keyof T];
        }

        // Oznacz pola jako przetworzone
        processedFields.add(firstNameField);
        processedFields.add(lastNameField);
      }
    }
  }

  // Przetwarzamy pozostałe pola
  for (const [key, field] of Object.entries(result)) {
    // Pomijamy już przetworzone pola
    if (processedFields.has(key)) {
      continue;
    }

    // Jeśli pole nie istnieje lub nie ma wartości, pomijamy je
    if (!field?.content) {
      continue;
    }

    // Znajdujemy odpowiednią regułę na podstawie mapowania lub oryginalnej nazwy pola
    const standardFieldName = fieldMappings[key] || key;
    const rule = fieldRules[standardFieldName];

    if (rule) {
      try {
        const processedValue = rule(field.content);
        if (processedValue !== field.content) {
          const processedField: DocumentField = {
            ...field,
            content: processedValue,
            confidence: field.confidence * 0.9,
            isEnriched: true
          };
          result[key as keyof T] = processedField as T[keyof T];
        }
      } catch (error) {
        console.error(`[processSection] Error processing field ${key}:`, error);
      }
    }
  }

  return result;
} 