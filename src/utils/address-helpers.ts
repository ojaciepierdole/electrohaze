import type { AddressSet } from '@/types/processing';

// Mapowanie pól na polskie etykiety
const POLISH_LABELS: Record<string, string> = {
  // Dane nabywcy (bez prefiksów)
  'FirstName': 'Imię',
  'LastName': 'Nazwisko',
  'CompanyName': 'Nazwa firmy',
  'Street': 'Ulica',
  'Building': 'Budynek',
  'Unit': 'Lokal',
  'PostalCode': 'Kod pocztowy',
  'City': 'Miejscowość',

  // Punkt Poboru Energii
  'ppeNum': 'Numer PPE',
  'supplierName': 'Sprzedawca',
  'OSD_name': 'Dystrybutor',
  'OSD_region': 'Region',
  'ProductName': 'Produkt',
  'Municipality': 'Gmina',
  'District': 'Powiat',
  'Province': 'Województwo',

  // Informacje o zużyciu
  'Tariff': 'Taryfa',
  'InvoiceType': 'Typ dokumentu',
  'BillingStartDate': 'Okres od',
  'BillingEndDate': 'Okres do',
  'BilledUsage': 'Naliczone zużycie',
  'ReadingType': 'Typ odczytu',
  'Usage12m': 'Zużycie roczne',

  // Adres korespondencyjny
  'paTitle': 'Tytuł',
  'paFirstName': 'Imię',
  'paLastName': 'Nazwisko',
  'paStreet': 'Ulica',
  'paBuilding': 'Budynek',
  'paUnit': 'Lokal',
  'paPostalCode': 'Kod pocztowy',
  'paCity': 'Miejscowość'
};

export function copyFields(data: AddressSet): AddressSet {
  const enriched = { ...data };
  const prefixes = ['pa', 'dp'] as const;
  
  // 1. Najpierw rozdzielamy numery budynków (przed jakimkolwiek formatowaniem)
  for (const prefix of ['', ...prefixes]) {
    const buildingField = `${prefix}Building` as keyof AddressSet;
    const unitField = `${prefix}Unit` as keyof AddressSet;

    if (enriched[buildingField]) {
      console.log(`[copyFields] Rozdzielanie numeru ${buildingField}:`, enriched[buildingField]);
      const numbers = parseAddressNumbers(enriched[buildingField]);
      if (numbers.building) {
        enriched[buildingField] = numbers.building;
        if (numbers.unit) {
          enriched[unitField] = numbers.unit;
        }
      }
    }
  }
  
  // 2. Potem formatujemy wszystkie pola na wielkie litery
  const fieldsToUpperCase = [
    'Street', 'Building', 'Unit', 'City', 'PostalCode', 'Province', 'District', 'Municipality'
  ];

  for (const prefix of ['', ...prefixes]) {
    for (const field of fieldsToUpperCase) {
      const fieldName = `${prefix}${field}` as keyof AddressSet;
      if (enriched[fieldName]) {
        console.log(`[copyFields] Konwersja na wielkie litery ${fieldName}:`, enriched[fieldName]);
        enriched[fieldName] = toUpperCase(enriched[fieldName] as string);
      }
    }
  }
  
  // 3. Potem przetwarzamy ulice - usuwamy prefiksy
  for (const prefix of ['', ...prefixes]) {
    const streetField = `${prefix}Street` as keyof AddressSet;
    if (enriched[streetField]) {
      console.log(`[copyFields] Przetwarzanie ulicy ${streetField}:`, enriched[streetField]);
      enriched[streetField] = removeStreetPrefix(formatAddress(enriched[streetField]));
    }
  }

  // 4. Końcowe formatowanie białych znaków
  for (const prefix of ['', ...prefixes]) {
    for (const field of fieldsToUpperCase) {
      const fieldName = `${prefix}${field}` as keyof AddressSet;
      if (enriched[fieldName]) {
        enriched[fieldName] = formatAddress(enriched[fieldName] as string);
      }
    }
  }

  return enriched;
}

function normalizeFieldName(field: string): string {
  return field.replace(/^(pa|ppe)/, '');
}

function parseAddressNumbers(
  value: string
): { building: string; unit?: string } {
  if (!value) return { building: '' };
  
  // Usuń wszystkie białe znaki i przecinki
  const cleanValue = value.trim().replace(/[\s,]+/g, '');
  
  console.log(`[parseAddressNumbers] Przetwarzanie wartości: "${cleanValue}"`);
  
  // Podstawowe wzorce dla różnych formatów
  const patterns = [
    // Format: 4C/29 lub 4C/29A (numer z literą/mieszkanie)
    {
      pattern: /^(\d+[A-Za-z]?)\/(\d+[A-Za-z]?)$/i,
      handler: (match: RegExpMatchArray) => ({
        building: match[1].toUpperCase(),
        unit: match[2].toUpperCase()
      })
    },
    
    // Format: 4/C/29 (numer/klatka/mieszkanie)
    {
      pattern: /^(\d+)\/([A-Za-z])\/(\d+[A-Za-z]?)$/i,
      handler: (match: RegExpMatchArray) => ({
        building: `${match[1]}${match[2]}`.toUpperCase(),
        unit: match[3].toUpperCase()
      })
    },
    
    // Format: 12A (tylko numer budynku z literą)
    {
      pattern: /^(\d+[A-Za-z]?)$/i,
      handler: (match: RegExpMatchArray) => ({
        building: match[1].toUpperCase()
      })
    },
    
    // Format: 12/34 (prosty numer/mieszkanie)
    {
      pattern: /^(\d+)\/(\d+[A-Za-z]?)$/i,
      handler: (match: RegExpMatchArray) => ({
        building: match[1].toUpperCase(),
        unit: match[2].toUpperCase()
      })
    },

    // Format: 12 m 34 lub 12 m. 34 (numer i mieszkanie z literą "m")
    {
      pattern: /^(\d+[A-Za-z]?)\s*m\.?\s*(\d+[A-Za-z]?)$/i,
      handler: (match: RegExpMatchArray) => ({
        building: match[1].toUpperCase(),
        unit: match[2].toUpperCase()
      })
    },

    // Format: 12 lok 34 lub 12 lok. 34 (numer i lokal)
    {
      pattern: /^(\d+[A-Za-z]?)\s*lok\.?\s*(\d+[A-Za-z]?)$/i,
      handler: (match: RegExpMatchArray) => ({
        building: match[1].toUpperCase(),
        unit: match[2].toUpperCase()
      })
    },

    // Format: 12/34/56 (numer budynku z klatką i mieszkaniem)
    {
      pattern: /^(\d+)\/(\d+)\/(\d+[A-Za-z]?)$/i,
      handler: (match: RegExpMatchArray) => ({
        building: `${match[1]}/${match[2]}`.toUpperCase(),
        unit: match[3].toUpperCase()
      })
    }
  ];

  for (const { pattern, handler } of patterns) {
    const match = cleanValue.match(pattern);
    if (match) {
      const result = handler(match);
      console.log(`[parseAddressNumbers] Dopasowano wzorzec:`, {
        pattern: pattern.toString(),
        result
      });
      return result;
    }
  }

  // Jeśli nie pasuje do żadnego wzorca, zwróć całą wartość jako numer budynku
  console.log(`[parseAddressNumbers] Brak dopasowania, zwracam jako numer budynku:`, { 
    building: cleanValue.toUpperCase() 
  });
  return { building: cleanValue.toUpperCase() };
}

// Funkcja do formatowania adresu
function formatAddress(value: string): string {
  // Usuń nadmiarowe białe znaki
  return value.trim().replace(/\s+/g, ' ');
}

// Funkcja do usuwania prefiksu ulicy
function removeStreetPrefix(value: string): string {
  if (!value) return '';
  
  // Usuń nadmiarowe białe znaki przed sprawdzeniem prefiksu
  const trimmed = value.trim();
  
  // Użyj bardziej precyzyjnego wzorca z granicą słowa
  const withoutPrefix = trimmed.replace(/^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO)\b\s*/i, '');
  
  console.log(`[removeStreetPrefix] ${value} -> ${withoutPrefix}`);
  return withoutPrefix;
}

// Funkcja do konwersji na wielkie litery
function toUpperCase(value: string): string {
  return value.toUpperCase();
}

export function normalizeAndSplitAddressNumbers(data: AddressSet): AddressSet {
  const result = { ...data };
  const prefixes = ['', 'pa', 'dp'] as const;
  
  // 1. Najpierw rozdzielamy numery budynków (przed jakimkolwiek formatowaniem)
  for (const prefix of prefixes) {
    const buildingField = `${prefix}Building` as keyof AddressSet;
    const unitField = `${prefix}Unit` as keyof AddressSet;

    if (result[buildingField]) {
      console.log(`[normalizeAndSplitAddressNumbers] Rozdzielanie numeru ${buildingField}:`, result[buildingField]);
      const numbers = parseAddressNumbers(result[buildingField]);
      if (numbers.building) {
        result[buildingField] = numbers.building;
        if (numbers.unit) {
          result[unitField] = numbers.unit;
        }
      }
    }
  }

  // 2. Potem formatujemy wszystkie pola na wielkie litery
  const fieldsToUpperCase = [
    'Street', 'Building', 'Unit', 'City', 'PostalCode', 'Province', 'District', 'Municipality'
  ];

  for (const prefix of prefixes) {
    for (const field of fieldsToUpperCase) {
      const fieldName = `${prefix}${field}` as keyof AddressSet;
      if (result[fieldName]) {
        console.log(`[normalizeAndSplitAddressNumbers] Konwersja na wielkie litery ${fieldName}:`, result[fieldName]);
        result[fieldName] = toUpperCase(result[fieldName] as string);
      }
    }
  }

  // 3. Na końcu przetwarzamy ulice - usuwamy prefiksy
  for (const prefix of prefixes) {
    const streetField = `${prefix}Street` as keyof AddressSet;
    if (result[streetField]) {
      console.log(`[normalizeAndSplitAddressNumbers] Przetwarzanie ulicy ${streetField}:`, result[streetField]);
      result[streetField] = removeStreetPrefix(formatAddress(result[streetField]));
    }
  }

  // 4. Końcowe formatowanie białych znaków
  for (const prefix of prefixes) {
    for (const field of fieldsToUpperCase) {
      const fieldName = `${prefix}${field}` as keyof AddressSet;
      if (result[fieldName]) {
        result[fieldName] = formatAddress(result[fieldName] as string);
      }
    }
  }

  return result;
}

function findSplitConfirmationInOtherSets(
  data: AddressSet,
  currentPrefix: string,
  value: string
): { building?: string; unit?: string } | null {
  console.log(`\n[findSplitConfirmationInOtherSets] Szukam potwierdzenia dla wartości: "${value}"`);
  console.log(`[findSplitConfirmationInOtherSets] Aktualny prefix: "${currentPrefix}"`);

  const prefixes = ['', 'pa', 'ppe'];
  const otherPrefixes = prefixes.filter(p => p !== currentPrefix);
  console.log(`[findSplitConfirmationInOtherSets] Sprawdzam prefiksy:`, otherPrefixes);

  for (const prefix of otherPrefixes) {
    const buildingField = `${prefix}Building` as keyof AddressSet;
    const unitField = `${prefix}Unit` as keyof AddressSet;

    console.log(`\n[findSplitConfirmationInOtherSets] Sprawdzam prefix: "${prefix}"`);
    console.log(`[findSplitConfirmationInOtherSets] Pole budynku: ${buildingField} = "${data[buildingField]}"`);
    console.log(`[findSplitConfirmationInOtherSets] Pole lokalu: ${unitField} = "${data[unitField]}"`);

    if (data[buildingField] && data[unitField]) {
      const combined = `${data[buildingField]}/${data[unitField]}`.replace(/\s+/g, '');
      console.log(`[findSplitConfirmationInOtherSets] Połączona wartość: "${combined}"`);
      
      if (combined === value) {
        console.log(`[findSplitConfirmationInOtherSets] Znaleziono dopasowanie!`);
        return {
          building: data[buildingField],
          unit: data[unitField]
        };
      }
    }
  }

  console.log(`[findSplitConfirmationInOtherSets] Nie znaleziono potwierdzenia`);
  return null;
}

// Eksportujemy funkcję do pobierania polskich etykiet
export function getFieldLabel(fieldName: string): string {
  // Najpierw sprawdź czy pole ma bezpośrednie mapowanie w POLISH_LABELS
  if (fieldName in POLISH_LABELS) {
    return POLISH_LABELS[fieldName];
  }

  // Jeśli nie znaleziono mapowania, zwróć oryginalną nazwę pola
  return fieldName;
}

// Funkcja testowa do sprawdzania formatów adresów
export function testAddressFormats(addresses: string[]): void {
  console.log('Testowanie formatów adresów:');
  console.log('---------------------------');
  
  addresses.forEach(address => {
    // Najpierw rozdziel numery
    const result = parseAddressNumbers(address);
    // Potem sformatuj wyniki
    const formattedBuilding = result.building ? formatAddress(result.building) : '';
    const formattedUnit = result.unit ? formatAddress(result.unit) : '-';
    
    console.log(`\nAdres: "${address}"`);
    console.log(`Budynek: "${formattedBuilding}"`);
    console.log(`Lokal: "${formattedUnit}"`);
  });
}

// Funkcja do testowania różnych formatów adresów
export function testParseAddressNumbers(): void {
  const testCases = [
    '4C/29',
    '4/C/29',
    '12A',
    '12/34',
    '123',
    '1/2/3',
    '10B/5A'
  ];

  console.log('Test parseAddressNumbers:');
  console.log('------------------------');
  
  testCases.forEach(testCase => {
    const result = parseAddressNumbers(testCase);
    console.log(`\nWejście: "${testCase}"`);
    console.log('Wynik:', result);
  });
}

// Uruchom testy jeśli plik jest wykonywany bezpośrednio
if (require.main === module) {
  testParseAddressNumbers();
} 