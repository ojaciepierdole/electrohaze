/**
 * Formatuje tekst według zasad:
 * - Jeśli tekst jest w całości wielkimi literami, zamienia na format zdania
 * - Jeśli tekst jest w całości małymi literami, zamienia na format zdania
 * - W przeciwnym razie zostawia bez zmian
 */
export function formatText(text: string | null): string {
  if (!text) return '';

  // Sprawdź czy tekst jest w całości wielkimi lub małymi literami
  const isAllUpper = text === text.toUpperCase();
  const isAllLower = text === text.toLowerCase();

  if (isAllUpper || isAllLower) {
    // Zamień na małe litery i podziel na słowa
    const words = text.toLowerCase().split(/\s+/);
    
    // Zamień pierwszą literę każdego słowa na wielką
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return text;
} 