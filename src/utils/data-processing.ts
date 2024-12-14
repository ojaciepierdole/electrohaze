import type { DocumentField } from '@/types/document-processing';
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

// Funkcja do czyszczenia tekstu ze znaków specjalnych
function cleanSpecialCharacters(value: string): string {
  if (!value) return '';
  
  return value
    .replace(/[^\w\sąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, ' ') // usuń wszystkie znaki specjalne (w tym przecinki) zamieniając je na spacje
    .replace(/\s+/g, ' ')                         // zamień wielokrotne spacje na pojedynczą
    .trim()                                       // usuń białe znaki z początku i końca
    .toUpperCase();                               // konwertuj na wielkie litery
}

// Funkcja do przetwarzania imienia i nazwiska
function normalizePersonName(value: string, isReversed = false) {
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
  
  // Jeśli kolejność jest odwrócona (nazwisko, imię)
  if (isReversed) {
    return {
      firstName: parts[parts.length - 1],
      lastName: parts.slice(0, -1).join(' ')
    };
  }
  
  // Standardowa kolejność (imię, nazwisko)
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

// Funkcja do normalizacji nazw ulic
function normalizeStreetName(value: string): string {
  if (!value) return '';
  
  // Wyczyść i znormalizuj tekst
  const cleaned = cleanSpecialCharacters(value);
  
  // Lista prefiksów do usunięcia
  const streetPrefixes = ['UL', 'ULICA', 'AL', 'ALEJA', 'PL', 'PLAC', 'OS', 'OSIEDLE'];
  
  // Usuń wszystkie prefiksy ze początku tekstu
  let words = cleaned.split(/\s+/);
  while (words.length > 0 && streetPrefixes.includes(words[0])) {
    words = words.slice(1);
  }
  
  // Jeśli nie zostały żadne słowa, zwróć oryginalny tekst bez prefiksów
  if (words.length === 0) {
    return cleaned;
  }
  
  // Usuń duplikaty słów
  const uniqueWords = [...new Set(words)];
  
  // Sprawdź czy słowa są podobne (mogą być duplikatami z drobnymi różnicami)
  const similarWords = uniqueWords.filter((word, index) => {
    for (let i = index + 1; i < uniqueWords.length; i++) {
      const similarity = calculateSimilarity(word, uniqueWords[i]);
      if (similarity > 0.8) { // 80% podobieństwa
        return false;
      }
    }
    return true;
  });
  
  return similarWords.join(' ');
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
      street: normalizeStreetName(street),
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

// Słownik poprawnych nazw OSD
const OSD_NAMES = {
  'RWE': 'RWE Stoen Operator Sp. z o.o.',
  'STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'RWE STOEN': 'RWE Stoen Operator Sp. z o.o.',
  'PGE': 'PGE Dystrybucja SA',
  'ENEA': 'Enea Operator Sp. z o.o.',
  'TAURON': 'Tauron Dystrybucja SA',
  'ENERGA': 'Energa-Operator SA',
  // Warianty z błędami
  'RWE STOEN OPERATOR': 'RWE Stoen Operator Sp. z o.o.',
  'RWE SP Z O O': 'RWE Stoen Operator Sp. z o.o.',
  'PGE DYSTRYBUCJA': 'PGE Dystrybucja SA',
  'PGE DYSTRYBUCJA S A': 'PGE Dystrybucja SA',
  'ENEA OPERATOR': 'Enea Operator Sp. z o.o.',
  'ENEA SP Z O O': 'Enea Operator Sp. z o.o.',
  'TAURON DYSTRYBUCJA': 'Tauron Dystrybucja SA',
  'TAURON DYSTRYBUCJA S A': 'Tauron Dystrybucja SA',
  'ENERGA OPERATOR': 'Energa-Operator SA',
  'ENERGA OPERATOR S A': 'Energa-Operator SA'
} as const;

// Funkcja do normalizacji nazwy OSD
function normalizeOSDName(value: string): string {
  if (!value) return '';
  
  // Normalizuj tekst do porównania
  const normalized = value
    .toUpperCase()
    .replace(/[^\w\s]/g, '') // usuń wszystkie znaki specjalne
    .replace(/\s+/g, ' ')    // zamień wielokrotne spacje na pojedynczą
    .trim();
  
  // Szukaj dokładnego dopasowania
  for (const [key, properName] of Object.entries(OSD_NAMES)) {
    if (normalized === key.toUpperCase()) {
      console.log('[normalizeOSDName] Znaleziono dokładne dopasowanie:', { input: value, output: properName });
      return properName;
    }
  }
  
  // Szukaj częściowego dopasowania
  for (const [key, properName] of Object.entries(OSD_NAMES)) {
    if (normalized.includes(key.toUpperCase())) {
      console.log('[normalizeOSDName] Znaleziono częściowe dopasowanie:', { input: value, output: properName });
      return properName;
    }
  }
  
  // Jeśli nie znaleziono dopasowania, zwróć oryginalną wartość
  console.log('[normalizeOSDName] Nie znaleziono dopasowania:', value);
  return value;
}

// Lista popularnych polskich nazwisk (które mogą być mylone z imionami)
const commonLastNames = new Set([
  'KOZAK', 'URBAŃCZYK', 'PROKOP', 'NOWAK', 'KOWALSKI', 'WIŚNIEWSKI', 'WÓJCIK', 'KOWALCZYK',
  'KAMIŃSKI', 'LEWANDOWSKI', 'ZIELIŃSKI', 'WOŹNIAK', 'SZYMAŃSKI', 'DĄBROWSKI', 'KOZŁOWSKI'
]);

// Funkcja do wykrywania prawidłowej kolejności imienia i nazwiska
function detectNameOrder(firstName: string, lastName: string): boolean {
  // Sprawdź czy wartości istnieją
  if (!firstName || !lastName) return false;

  const cleanedFirst = cleanSpecialCharacters(firstName);
  const cleanedLast = cleanSpecialCharacters(lastName);

  console.log('[detectNameOrder] Analiza:', {
    firstName: cleanedFirst,
    lastName: cleanedLast
  });

  // Sprawdź czy któraś z wartości jest popularnym imieniem lub nazwiskiem
  const firstIsCommonName = commonFirstNames.has(cleanedFirst);
  const lastIsCommonName = commonFirstNames.has(cleanedLast);
  const firstIsCommonLastName = commonLastNames.has(cleanedFirst);
  const lastIsCommonLastName = commonLastNames.has(cleanedLast);

  console.log('[detectNameOrder] Wynik:', {
    firstIsCommonName,
    lastIsCommonName,
    firstIsCommonLastName,
    lastIsCommonLastName
  });

  // Jeśli pierwsza wartość to imię, a druga to nazwisko
  if (firstIsCommonName && !lastIsCommonName) return true;
  
  // Jeśli pierwsza wartość to nazwisko, a druga to imię
  if (!firstIsCommonName && lastIsCommonName) return false;
  
  // Jeśli pierwsza wartość to nazwisko z listy nazwisk
  if (firstIsCommonLastName && !lastIsCommonLastName) return false;
  
  // Jeśli druga wartość to nazwisko z listy nazwisk
  if (!firstIsCommonLastName && lastIsCommonLastName) return true;

  // Jeśli nie możemy określić na podstawie list,
  // zakładamy że kolejność jest prawidłowa
  return true;
}

// Funkcja do przetwarzania pary imię-nazwisko
function processPersonName(firstName: string | null, lastName: string | null): { firstName: string, lastName: string } {
  console.log('[processPersonName] Wejście:', { firstName, lastName });

  // Wyczyść dane wejściowe
  const cleanedFirst = firstName ? cleanSpecialCharacters(firstName) : '';
  const cleanedLast = lastName ? cleanSpecialCharacters(lastName) : '';

  // Jeśli mamy tylko jedną wartość
  if (!cleanedFirst || !cleanedLast) {
    // Jeśli mamy tylko pierwszą wartość
    if (cleanedFirst && !cleanedLast) {
      // Sprawdź czy to może być nazwisko
      const isFirstName = commonFirstNames.has(cleanedFirst);
      const isLastName = commonLastNames.has(cleanedFirst);
      
      if (!isFirstName && isLastName) {
        // To prawdopodobnie nazwisko
        return { firstName: '', lastName: cleanedFirst };
      }
    }
    // W innych przypadkach zwróć wartości jak są
    return { firstName: cleanedFirst, lastName: cleanedLast };
  }

  // Sprawdź czy kolejność jest prawidłowa
  const isCorrectOrder = detectNameOrder(cleanedFirst, cleanedLast);
  console.log('[processPersonName] Wynik analizy kolejności:', {
    cleanedFirst,
    cleanedLast,
    isCorrectOrder
  });

  if (!isCorrectOrder) {
    // Zamień wartości miejscami
    console.log('[processPersonName] Zamieniam kolejność');
    return {
      firstName: cleanedLast,
      lastName: cleanedFirst
    };
  }

  return { 
    firstName: cleanedFirst, 
    lastName: cleanedLast 
  };
}

// Funkcja do normalizacji nazw miejscowości
function normalizeLocationName(value: string): string {
  if (!value) return '';
  
  // Wyczyść i znormalizuj tekst
  const cleaned = cleanSpecialCharacters(value);
  
  // Usuń duplikaty słów
  const words = cleaned.split(/\s+/);
  const uniqueWords = [...new Set(words)];
  
  // Jeśli mamy tylko jedno słowo, zwróć je
  if (uniqueWords.length === 1) {
    return uniqueWords[0];
  }
  
  // Sprawdź czy słowa są podobne (mogą być duplikatami z drobnymi różnicami)
  const similarWords = uniqueWords.filter((word, index) => {
    for (let i = index + 1; i < uniqueWords.length; i++) {
      const similarity = calculateSimilarity(word, uniqueWords[i]);
      if (similarity > 0.8) { // 80% podobieństwa
        return false;
      }
    }
    return true;
  });
  
  return similarWords.join(' ');
}

// Funkcja pomocnicza do obliczania podobieństwa tekstu (algorytm Levenshtein)
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,        // deletion
        matrix[i][j - 1] + 1,        // insertion
        matrix[i - 1][j - 1] + cost  // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLength = Math.max(len1, len2);
  return 1 - distance / maxLength;
}

// Reguły przetwarzania dla pól
const fieldRules: Record<string, (value: string, allFields?: Record<string, DocumentField>) => string> = {
  // Reguły dla adresów
  Street: (value) => {
    console.log('[Street] Przetwarzanie:', value);
    const cleaned = cleanSpecialCharacters(value);
    const result = normalizeAddress(cleaned);
    console.log('[Street] Wynik:', result);
    return result.street || cleaned;
  },
  Building: (value) => {
    console.log('[Building] Przetwarzanie:', value);
    const cleaned = cleanSpecialCharacters(value);
    const result = splitBuildingNumber(cleaned, false);
    console.log('[Building] Wynik:', result);
    return result.building || cleaned;
  },
  Unit: (value) => {
    console.log('[Unit] Przetwarzanie:', value);
    const cleaned = cleanSpecialCharacters(value);
    const result = splitBuildingNumber(cleaned, true);
    console.log('[Unit] Wynik:', result);
    return result.unit || cleaned;
  },
  PostalCode: (value) => {
    const cleaned = value?.replace(/\s+/g, '');
    return cleaned?.match(/\d{2}-\d{3}/) ? cleaned : cleaned?.replace(/(\d{2})(\d{3})/, '$1-$2');
  },
  City: (value) => normalizeLocationName(cleanSpecialCharacters(value)),
  Municipality: (value) => normalizeLocationName(cleanSpecialCharacters(value)),
  District: (value) => normalizeLocationName(cleanSpecialCharacters(value)),
  Province: (value) => normalizeLocationName(cleanSpecialCharacters(value)),
  
  // Reguły dla danych osobowych
  FirstName: (value, allFields) => {
    if (!allFields) return cleanSpecialCharacters(value);
    
    // Znajdź odpowiadające pole nazwiska
    let lastNameField = '';
    if ('LastName' in allFields) lastNameField = 'LastName';
    else if ('dpLastName' in allFields) lastNameField = 'dpLastName';
    else if ('paLastName' in allFields) lastNameField = 'paLastName';
    
    const lastName = lastNameField ? allFields[lastNameField]?.content : null;
    console.log('[FirstName] Znalezione pola:', { value, lastName, lastNameField });
    
    const result = processPersonName(value, lastName);
    return result.firstName;
  },
  LastName: (value, allFields) => {
    if (!allFields) return cleanSpecialCharacters(value);
    
    // Znajdź odpowiadające pole imienia
    let firstNameField = '';
    if ('FirstName' in allFields) firstNameField = 'FirstName';
    else if ('dpFirstName' in allFields) firstNameField = 'dpFirstName';
    else if ('paFirstName' in allFields) firstNameField = 'paFirstName';
    
    const firstName = firstNameField ? allFields[firstNameField]?.content : null;
    console.log('[LastName] Znalezione pola:', { firstName, value, firstNameField });
    
    const result = processPersonName(firstName, value);
    return result.lastName;
  },
  
  // Reguły dla numerów i identyfikatorów
  MeterNumber: (value) => cleanSpecialCharacters(value),
  ContractNumber: (value) => cleanSpecialCharacters(value),
  ppeNum: (value) => value?.replace(/[^\d]/g, ''),
  taxID: (value) => value?.replace(/[^\d]/g, ''),
  
  // Reguły dla pozostałych pól
  BusinessName: (value) => cleanSpecialCharacters(value),
  Tariff: (value) => cleanSpecialCharacters(value),
  ContractType: (value) => cleanSpecialCharacters(value),
  OSD_name: (value) => normalizeOSDName(cleanSpecialCharacters(value))
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
  supplierStreet: 'Street',
  supplierBuilding: 'Building',
  supplierUnit: 'Unit',
  supplierPostalCode: 'PostalCode',
  supplierCity: 'City',
  supplierBusinessName: 'BusinessName'
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
  data: T
): T {
  let result = { ...data } as T;

  console.log(`[processSection] Przetwarzanie sekcji ${section}:`, {
    inputFields: Object.keys(data)
  });

  // Zbiór przetworzonych pól
  const processedFields = new Set<string>();

  // Najpierw przetwarzamy pary imię-nazwisko
  for (const [firstNameField, lastNameField] of Object.entries(fieldPairs)) {
    // Sprawdź czy mamy oba pola w danych
    if (firstNameField in data && lastNameField in data) {
      const firstName = data[firstNameField]?.content;
      const lastName = data[lastNameField]?.content;

      if (firstName || lastName) {
        console.log(`[processSection] Przetwarzam parę pól ${firstNameField}-${lastNameField}:`, {
          firstName,
          lastName
        });

        const processedName = processPersonName(firstName, lastName);
        
        // Aktualizuj pole imienia
        if (firstName !== processedName.firstName) {
          result[firstNameField as keyof T] = {
            ...data[firstNameField],
            content: processedName.firstName,
            confidence: (data[firstNameField]?.confidence || 1) * 0.9
          } as T[keyof T];
        }
        
        // Aktualizuj pole nazwiska
        if (lastName !== processedName.lastName) {
          result[lastNameField as keyof T] = {
            ...data[lastNameField],
            content: processedName.lastName,
            confidence: (data[lastNameField]?.confidence || 1) * 0.9
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
      console.log(`[processSection] Pomijam puste pole ${key}`);
      continue;
    }

    // Znajdujemy odpowiednią regułę na podstawie mapowania lub oryginalnej nazwy pola
    const standardFieldName = fieldMappings[key] || key;
    const rule = fieldRules[standardFieldName];

    if (rule) {
      try {
        console.log(`[processSection] Przetwarzam pole ${key} (${standardFieldName}):`, {
          originalValue: field.content,
          confidence: field.confidence
        });

        const processedValue = rule(field.content);
        if (processedValue !== field.content) {
          const processedField: DocumentField = {
            ...field,
            content: processedValue,
            confidence: field.confidence * 0.9
          };
          result[key as keyof T] = processedField as T[keyof T];

          console.log(`[processSection] Pole ${key} przetworzone:`, {
            newValue: processedValue,
            newConfidence: processedField.confidence
          });
        }
      } catch (error) {
        console.error(`[processSection] Błąd przetwarzania pola ${key}:`, error);
      }
    } else {
      console.log(`[processSection] Brak reguły dla pola ${standardFieldName}`);
    }
  }

  return result;
} 