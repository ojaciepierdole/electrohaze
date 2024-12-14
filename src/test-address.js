// Funkcje pomocnicze
function formatAddress(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function removeStreetPrefix(value) {
  console.log(`[removeStreetPrefix] Przed: "${value}"`);
  if (!value) return '';
  const trimmed = value.trim();
  const withoutPrefix = trimmed.replace(/^(?:UL|UL\.|ULICA|AL|AL\.|ALEJA|PL|PL\.|PLAC|RONDO)\b\s*/i, '');
  console.log(`[removeStreetPrefix] Po: "${withoutPrefix}"`);
  return withoutPrefix;
}

function toUpperCase(value) {
  return value.toUpperCase();
}

function parseAddressNumbers(value) {
  if (!value) return { building: '' };
  
  // Usuń wszystkie białe znaki
  const cleanValue = value.trim().replace(/\s+/g, '');
  
  console.log(`[parseAddressNumbers] Przetwarzanie wartości: "${cleanValue}"`);
  
  // Podstawowe wzorce dla różnych formatów
  const patterns = [
    // Format: 4C/29 (numer z literą/mieszkanie)
    {
      pattern: /^(\d+[A-Za-z]?)\/(\d+[A-Za-z]?)$/,
      handler: (match) => ({
        building: match[1],
        unit: match[2]
      })
    },
    
    // Format: 4/C/29 (numer/klatka/mieszkanie)
    {
      pattern: /^(\d+)\/([A-Za-z])\/(\d+[A-Za-z]?)$/,
      handler: (match) => ({
        building: `${match[1]}${match[2]}`,
        unit: match[3]
      })
    },
    
    // Format: 12A (tylko numer budynku z literą)
    {
      pattern: /^(\d+[A-Za-z]?)$/,
      handler: (match) => ({
        building: match[1]
      })
    },
    
    // Format: 12/34 (prosty numer/mieszkanie)
    {
      pattern: /^(\d+)\/(\d+)$/,
      handler: (match) => ({
        building: match[1],
        unit: match[2]
      })
    }
  ];

  for (const { pattern, handler } of patterns) {
    const match = cleanValue.match(pattern);
    if (match) {
      const result = handler(match);
      console.log(`[parseAddressNumbers] Dopasowano wzorzec:`, result);
      return result;
    }
  }

  console.log(`[parseAddressNumbers] Brak dopasowania, zwracam jako numer budynku:`, { building: cleanValue });
  return { building: cleanValue };
}

// Symulacja przetwarzania całego zestawu danych
function processAddressSet(data) {
  console.log('\nPrzetwarzanie zestawu danych:');
  console.log('---------------------------');
  console.log('Dane wejściowe:', data);

  const result = { ...data };

  // 1. Przetwarzanie ulicy
  if (result.Street) {
    console.log('\n1. Przetwarzanie ulicy:');
    console.log('Oryginał:', result.Street);
    result.Street = removeStreetPrefix(result.Street);
    console.log('Po usunięciu prefiksu:', result.Street);
    result.Street = toUpperCase(result.Street);
    console.log('Po konwersji na wielkie litery:', result.Street);
  }

  // 2. Przetwarzanie numeru budynku
  if (result.Building) {
    console.log('\n2. Przetwarzanie numeru budynku:');
    console.log('Oryginał:', result.Building);
    const numbers = parseAddressNumbers(result.Building);
    result.Building = numbers.building;
    if (numbers.unit) {
      result.Unit = numbers.unit;
    }
    console.log('Po rozdzieleniu:', { Building: result.Building, Unit: result.Unit });
    result.Building = toUpperCase(result.Building);
    if (result.Unit) {
      result.Unit = toUpperCase(result.Unit);
    }
    console.log('Po konwersji na wielkie litery:', { Building: result.Building, Unit: result.Unit });
  }

  console.log('\nWynik końcowy:', result);
  return result;
}

// Testy
console.log('=== TESTY SZCZEGÓŁOWE ===\n');

// Test 1: Podstawowy przypadek z obrazka
console.log('Test 1: Przypadek z obrazka');
const test1 = processAddressSet({
  Street: 'UL GIEŁDOWA',
  Building: '4C/29'
});

// Test 2: Wariant z małymi literami
console.log('\nTest 2: Wariant z małymi literami');
const test2 = processAddressSet({
  Street: 'ul Giełdowa',
  Building: '4c/29'
});

// Test 3: Wariant z dodatkowymi spacjami
console.log('\nTest 3: Wariant z dodatkowymi spacjami');
const test3 = processAddressSet({
  Street: '  UL   GIEŁDOWA  ',
  Building: ' 4C / 29 '
});

// Test 4: Wariant z innym formatem numeru
console.log('\nTest 4: Wariant z innym formatem numeru');
const test4 = processAddressSet({
  Street: 'ULICA GIEŁDOWA',
  Building: '4/C/29'
});

// Test pełnego procesu przetwarzania
console.log('\n=== TEST PEŁNEGO PROCESU ===');
console.log('Przypadek z obrazka - adres "UL GIEŁDOWA 4C/29"');

const addressSet = {
  Street: 'ul Giełdowa',
  Building: '4C/29',
  City: 'Warszawa'
};

console.log('\nDane wejściowe:', addressSet);

// 1. Konwersja na wielkie litery
console.log('\n1. Konwersja na wielkie litery:');
const upperCase = {
  Street: toUpperCase(addressSet.Street),
  Building: toUpperCase(addressSet.Building),
  City: toUpperCase(addressSet.City)
};
console.log(upperCase);

// 2. Usunięcie prefiksu ulicy
console.log('\n2. Usunięcie prefiksu ulicy:');
upperCase.Street = removeStreetPrefix(upperCase.Street);
console.log(upperCase);

// 3. Rozdzielenie numerów
console.log('\n3. Rozdzielenie numerów:');
const numbers = parseAddressNumbers(upperCase.Building);
const finalResult = {
  ...upperCase,
  Building: numbers.building,
  Unit: numbers.unit
};
console.log(finalResult); 