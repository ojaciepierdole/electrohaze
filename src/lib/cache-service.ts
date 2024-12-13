import { DocumentAnalysisResponse } from '@/types/azure';

interface CacheEntry {
  result: DocumentAnalysisResponse;
  timestamp: number;
  hash: string;
}

interface CacheOptions {
  ttl: number; // czas życia w milisekundach
  maxSize: number; // maksymalna liczba elementów w cache
}

export class DocumentCache {
  private cache: Map<string, CacheEntry>;
  private options: CacheOptions;
  private static instance: DocumentCache;

  private constructor(options: Partial<CacheOptions> = {}) {
    this.cache = new Map();
    this.options = {
      ttl: 24 * 60 * 60 * 1000, // 24 godziny
      maxSize: 1000,
      ...options
    };
  }

  static getInstance(options?: Partial<CacheOptions>): DocumentCache {
    if (!DocumentCache.instance) {
      DocumentCache.instance = new DocumentCache(options);
    }
    return DocumentCache.instance;
  }

  private async calculateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private generateKey(fileHash: string, modelId: string): string {
    return `${fileHash}:${modelId}`;
  }

  private cleanOldEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.options.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.options.maxSize) return;

    // Usuń najstarsze wpisy
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    const entriesToRemove = entries.slice(0, entries.length - this.options.maxSize);
    for (const [key] of entriesToRemove) {
      this.cache.delete(key);
    }
  }

  async get(file: File, modelId: string): Promise<DocumentAnalysisResponse | null> {
    this.cleanOldEntries();

    const hash = await this.calculateHash(file);
    const key = this.generateKey(hash, modelId);
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.result;
  }

  async set(file: File, modelId: string, result: DocumentAnalysisResponse): Promise<void> {
    const hash = await this.calculateHash(file);
    const key = this.generateKey(hash, modelId);

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      hash
    });

    this.enforceMaxSize();
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; ttl: number } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      ttl: this.options.ttl
    };
  }
} 