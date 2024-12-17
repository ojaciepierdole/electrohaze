// Funkcja do czyszczenia nazw OSD
export function cleanOSDName(name: string): string {
  if (!name) return '';

  // Lista słów do usunięcia
  const wordsToRemove = [
    'TARYFA',
    'ENERGA',
    'OPERATOR',
    'S.A.',
    'SA',
    'SP. Z O.O.',
    'SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ',
    'SPÓŁKA AKCYJNA',
    'DYSTRYBUCJA',
    'ODDZIAŁ',
    'W',
    'ZAKŁAD',
    'ENERGIA',
    'OPERATORZY',
    'SYSTEMU',
    'DYSTRYBUCYJNEGO'
  ];

  // Zamień na wielkie litery i usuń zbędne spacje
  let cleanedName = name.toUpperCase().trim();

  // Usuń słowa z listy
  wordsToRemove.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    cleanedName = cleanedName.replace(regex, '');
  });

  // Usuń wielokrotne spacje i spacje na końcach
  cleanedName = cleanedName
    .replace(/\s+/g, ' ')
    .trim();

  return cleanedName;
}

// Funkcja do czyszczenia nazwy regionu OSD
export function cleanOSDRegion(region: string): string {
  if (!region) return '';

  return region.toUpperCase().trim()
    .replace(/^ODDZIAŁ\s+/i, '')
    .replace(/\s+W\s+/, ' ');
} 