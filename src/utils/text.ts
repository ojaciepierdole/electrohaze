/**
 * Formatuje tekst według zasad:
 * - Jeśli tekst jest w całości wielkimi literami, zamienia na format zdania
 * - Jeśli tekst jest w całości małymi literami, zamienia na format zdania
 * - W przeciwnym razie zostawia bez zmian
 */
export function formatText(text: string | null | undefined): string {
  if (!text) return '';

  // Sprawdź czy tekst jest w całości wielkimi lub małymi literami
  const isAllUpper = text === text.toUpperCase();
  const isAllLower = text === text.toLowerCase();

  if (isAllUpper || isAllLower) {
    // Zamień pierwszą literę na wielką, resztę na małe
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  // Jeśli tekst ma mieszane wielkości liter, zostaw go bez zmian
  return text;
} 