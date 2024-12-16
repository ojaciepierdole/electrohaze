/**
 * Opóźnia wykonanie kodu o zadaną liczbę milisekund
 * @param ms Liczba milisekund do odczekania
 * @returns Promise, który rozwiązuje się po upływie zadanego czasu
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formatuje czas w milisekundach na czytelny format
 * @param ms Liczba milisekund
 * @returns Sformatowany czas (np. "2.5s" lub "150ms")
 */
export function formatTime(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

/**
 * Mierzy czas wykonania funkcji
 * @param fn Funkcja do zmierzenia
 * @returns Tuple [wynik funkcji, czas wykonania w ms]
 */
export async function measureTime<T>(fn: () => Promise<T>): Promise<[T, number]> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return [result, end - start];
} 