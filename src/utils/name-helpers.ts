import type { AddressSet } from '@/types/processing';

type SurnameEnding = {
  female: string;
  collective: string;
  male: string;
  pattern?: RegExp;
};

// Lista popularnych końcówek nazwisk żeńskich i ich odpowiedników w formie kolektywnej
const SURNAME_ENDINGS: readonly SurnameEnding[] = [
  // Podstawowe końcówki -ski/-ska/-scy
  { female: 'ska', collective: 'scy', male: 'ski' },
  { female: 'cka', collective: 'ccy', male: 'cki' },
  { female: 'dzka', collective: 'dzcy', male: 'dzki' },
  { female: 'żka', collective: 'żcy', male: 'żki' },
  { female: 'czka', collective: 'ccy', male: 'cki' },
  
  // Końcówki -ny/-na/-ni
  { female: 'na', collective: 'ni', male: 'ny' },
  
  // Końcówki -owy/-owa/-owi
  { female: 'owa', collective: 'owi', male: 'owy' },
  
  // Końcówki -y/-a/-i
  { female: 'a', collective: 'i', male: 'y', pattern: /[^aeiouy]a$/ },
  
  // Końcówki -i/-a/-i (np. Górski/Górska/Górscy)
  { female: 'a', collective: 'i', male: 'i', pattern: /[^aeiouy]a$/ },

  // Końcówki -ec/-ca/-cy (np. Wdowiec/Wdowca/Wdowcy)
  { female: 'ca', collective: 'cy', male: 'ec', pattern: /[^aeiouy]ca$/ }
] as const;

// Lista końcówek nazwisk, które nie zmieniają formy
const INVARIANT_ENDINGS = [
  'czyk', 'ak', 'ek', 'ik', 'yk', 'or', 'ar', 'er', 'uk', 
  'ko', 'ło', 'no', 'ro', 'sz', 'cz', 'dz', 'rz'
];

// Lista nazwisk z nietypową odmianą
const IRREGULAR_SURNAMES: ReadonlyMap<string, string> = new Map([
  ['zając', 'zającowie'],
  ['zając', 'zające'],
  ['krawiec', 'krawcowie'],
  ['szwiec', 'szewcowie']
]);

function normalizeSpaces(text: string): string {
  // Normalizuje spacje w tekście, zachowując spacje w nazwiskach dwuczłonowych
  return text
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanupName(name: string): string {
  return name
    .replace(/["""()[\]{}]/g, '') // Usuń cudzysłowy i nawiasy
    .replace(/\s+/g, ' ')         // Normalizuj spacje
    .trim();
}

function expandInitials(name: string): string {
  // Zachowaj inicjały bez zmian
  return name.replace(/([A-Z])\./g, '$1.');
}

function isInvariantSurname(surname: string): boolean {
  const normalized = surname.toLowerCase().trim();
  return INVARIANT_ENDINGS.some(ending => normalized.endsWith(ending));
}

function isFemaleName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  // Lista wyjątków - imiona męskie kończące się na 'a'
  const maleExceptions = ['kuba', 'barnaba', 'bonawentura', 'kosma'];
  
  if (maleExceptions.includes(normalized)) {
    return false;
  }
  
  // Większość polskich imion żeńskich kończy się na 'a'
  return normalized.endsWith('a');
}

function processCompoundSurname(surname: string, surnames: string[], separator: string = '-'): string | null {
  // Obsługa nazwisk dwuczłonowych
  const parts = surname.split(separator);
  if (parts.length !== 2) return null;

  // Sprawdzamy każdą część osobno
  const processedParts = parts.map((part, index) => {
    // Szukamy odpowiadającej części w innych nazwiskach
    const matchingParts = surnames
      .filter(s => s !== surname)
      .map(s => s.split(separator)[index])
      .filter(Boolean);

    if (matchingParts.length === 0) return part;

    // Próbujemy znaleźć formę kolektywną dla tej części
    const collectiveForm = getCollectiveSurname([part, ...matchingParts]);
    return collectiveForm || part;
  });

  return processedParts.join(separator);
}

function getCollectiveSurname(surnames: string[]): string | null {
  if (surnames.length < 2) return null;

  // Czyścimy i normalizujemy nazwiska
  const cleanedSurnames = surnames.map(cleanupName);
  const normalizedSurnames = cleanedSurnames.map(s => s.trim().toLowerCase());
  
  // Sprawdzamy formy nieregularne
  for (const [irregular, collective] of Array.from(IRREGULAR_SURNAMES)) {
    if (normalizedSurnames.some(s => s === irregular)) {
      return collective;
    }
  }

  // Sprawdzamy czy mamy nazwisko dwuczłonowe (z myślnikiem lub spacją)
  if (cleanedSurnames.some(s => s.includes('-'))) {
    const compoundResult = processCompoundSurname(cleanedSurnames[0], cleanedSurnames, '-');
    if (compoundResult) return compoundResult;
  }
  
  if (cleanedSurnames.some(s => s.includes(' '))) {
    const compoundResult = processCompoundSurname(cleanedSurnames[0], cleanedSurnames, ' ');
    if (compoundResult) return compoundResult;
  }

  // Sprawdzamy czy nazwiska są różne (nie tylko odmienne formy tego samego nazwiska)
  const bases = new Set(normalizedSurnames.map(s => {
    for (const { female } of SURNAME_ENDINGS) {
      if (s.endsWith(female)) return s.slice(0, -female.length);
    }
    return s;
  }));
  
  if (bases.size > 1) {
    // Jeśli nazwiska są różne, zwracamy pierwsze
    return cleanedSurnames[0];
  }

  // Sprawdzamy czy to nazwisko nieodmienne
  if (normalizedSurnames.some(isInvariantSurname)) {
    return cleanedSurnames[0];
  }
  
  // Sprawdzamy czy mamy parę nazwisk różniących się końcówką
  for (const { female, collective, male, pattern } of SURNAME_ENDINGS) {
    const withFemaleEnding = normalizedSurnames.find(s => 
      pattern ? pattern.test(s) : s.endsWith(female)
    );
    if (!withFemaleEnding) continue;

    let base: string;
    if (pattern) {
      base = withFemaleEnding.slice(0, -1); // Dla wzorców z pojedynczą literą
    } else {
      base = withFemaleEnding.slice(0, -female.length);
    }

    const withMaleEnding = normalizedSurnames.find(
      s => s === base + male
    );

    if (withMaleEnding) {
      // Znaleziono parę, zwracamy formę kolektywną zachowując wielkość liter z oryginalnego nazwiska
      const originalCase = cleanedSurnames.find(s => s.toLowerCase() === withMaleEnding)!;
      const prefix = originalCase.slice(0, -male.length);
      return prefix + collective;
    }
  }

  return null;
}

function parseNameString(nameString: string): {
  firstNames: string[];
  surnames: string[];
} {
  // Czyścimy string wejściowy
  const cleaned = cleanupName(nameString);
  
  // Rozdzielamy po przecinku, spójniku "i" oraz myślniku (gdy nie jest częścią nazwiska)
  const parts = cleaned
    .split(/,|\si\s|(?<!\w)-(?!\w)/)
    .map(p => p.trim())
    .filter(Boolean);

  const result = {
    firstNames: [] as string[],
    surnames: [] as string[]
  };

  for (const part of parts) {
    const words = part.split(/\s+/);
    
    if (words.length === 1) {
      // Jeśli mamy jedno słowo, zakładamy że to nazwisko
      result.surnames.push(expandInitials(words[0]));
    } else {
      // Jeśli więcej słów, ostatnie traktujemy jako nazwisko, resztę jako imiona
      const surname = words.slice(-1)[0];
      // Sprawdzamy czy to nie jest nazwisko dwuczłonowe
      if (words.length > 2 && /[A-Z]/.test(words[words.length - 2][0])) {
        result.surnames.push(expandInitials(words.slice(-2).join(' ')));
        result.firstNames.push(...words.slice(0, -2).map(expandInitials));
      } else {
        result.surnames.push(expandInitials(surname));
        result.firstNames.push(...words.slice(0, -1).map(expandInitials));
      }
    }
  }

  return result;
}

export function processNames(nameString: string): {
  title: string;
  firstName: string;
  lastName: string;
} {
  const { firstNames, surnames } = parseNameString(nameString);

  // Sprawdzamy czy mamy parę (kobieta i mężczyzna)
  const hasFemaleName = firstNames.some(isFemaleName);
  const hasMaleName = firstNames.some(name => !isFemaleName(name));
  const isCouple = hasFemaleName && hasMaleName;

  // Próbujemy uzyskać formę kolektywną nazwiska
  const collectiveSurname = getCollectiveSurname(surnames);

  return {
    title: isCouple ? 'Państwo' : '',
    firstName: firstNames.join(' i '),
    lastName: collectiveSurname || surnames[0] || ''
  };
}

export function normalizeNameFields(data: AddressSet): AddressSet {
  const enriched = { ...data };
  const prefixes = ['', 'pa', 'ppe'] as const;

  for (const prefix of prefixes) {
    const firstNameField = `${prefix}FirstName` as keyof AddressSet;
    const lastNameField = `${prefix}LastName` as keyof AddressSet;
    const titleField = `${prefix}Title` as keyof AddressSet;

    // Sprawdzamy czy mamy dane do przetworzenia
    const firstName = enriched[firstNameField];
    const lastName = enriched[lastNameField];

    if (firstName || lastName) {
      // Łączymy dostępne dane w jeden string
      const nameString = [firstName, lastName].filter(Boolean).join(' ');
      
      // Przetwarzamy dane
      const { title, firstName: newFirstName, lastName: newLastName } = processNames(nameString);

      // Aktualizujemy pola tylko jeśli mamy nowe wartości
      if (title) enriched[titleField] = title;
      if (newFirstName) enriched[firstNameField] = newFirstName;
      if (newLastName) enriched[lastNameField] = newLastName;
    }
  }

  return enriched;
} 