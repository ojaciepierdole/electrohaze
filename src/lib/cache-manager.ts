import type { ProcessingResult } from '@/types/processing';

interface CacheEntry {
  result: ProcessingResult;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 godzina
  private readonly MAX_SIZE = 1000; // Maksymalna liczba wpisów w cache

  private generateKey(fileName: string, modelId: string): string {
    return `${fileName}:${modelId}`;
  }

  set(fileName: string, modelId: string, result: ProcessingResult): void {
    const key = this.generateKey(fileName, modelId);
    
    // Jeśli cache jest pełny, usuń najstarszy wpis
    if (this.cache.size >= this.MAX_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  get(fileName: string, modelId: string): ProcessingResult | null {
    const key = this.generateKey(fileName, modelId);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Sprawdź czy cache nie wygasł
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  clear(): void {
    this.cache.clear();
  }

  // Usuń przeterminowane wpisy
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    });
  }

  // Gettery dla właściwości cache
  get size(): number {
    return this.cache.size;
  }

  get maxSize(): number {
    return this.MAX_SIZE;
  }

  get ttl(): number {
    return this.CACHE_DURATION / 1000; // Zwracamy w sekundach
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Automatyczne czyszczenie cache co godzinę
setInterval(() => {
  cacheManager.cleanup();
}, 1000 * 60 * 60); 