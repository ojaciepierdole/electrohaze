/**
 * Formatuje tekst według zasad:
 * - Jeśli tekst jest w całości wielkimi literami, zamienia na format zdania
 * - Jeśli tekst jest w całości małymi literami, zamienia na format zdania
 * - W przeciwnym razie zostawia bez zmian
 */
export function formatText(text: string | null | undefined): string {
  // Jeśli text jest null, undefined lub nie jest stringiem, zwróć pusty string
  if (!text || typeof text !== 'string') return '';

  // Sprawdź czy tekst jest w całości wielkimi lub małymi literami
  // Używamy trim() aby pozbyć się białych znaków na początku i końcu
  const trimmedText = text.trim();
  if (!trimmedText) return '';

  const isAllUpper = trimmedText === trimmedText.toUpperCase();
  const isAllLower = trimmedText === trimmedText.toLowerCase();

  if (isAllUpper || isAllLower) {
    // Zamień pierwszą literę na wielką, resztę na małe
    return trimmedText.charAt(0).toUpperCase() + trimmedText.slice(1).toLowerCase();
  }

  // Jeśli tekst ma mieszane wielkości liter, zostaw go bez zmian
  return trimmedText;
} 